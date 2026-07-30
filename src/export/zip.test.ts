import { describe, expect, it } from 'vitest';
import { zipStore } from './zip';

const enc = new TextEncoder();

describe('Unit', () => {
  it('opens with the local file header signature PK\\x03\\x04', () => {
    const out = zipStore([{ name: 'a.txt', bytes: enc.encode('hi') }]);
    expect([out[0], out[1], out[2], out[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('writes stored-method local header fields for a known entry', () => {
    const name = 'hello.txt';
    const data = enc.encode('ABCDE');
    const out = zipStore([{ name, bytes: data }]);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    // Local header fixed part is 30 bytes; name begins at offset 30.
    expect(view.getUint16(8, true)).toBe(0); // compression method = STORED
    expect(view.getUint32(18, true)).toBe(5); // compressed size == byte length
    expect(view.getUint32(22, true)).toBe(5); // uncompressed size == byte length
    expect(view.getUint16(18, true)).toBe(view.getUint16(22, true)); // sizes equal
    expect(view.getUint16(26, true)).toBe(9); // file name length ("hello.txt")
    expect(view.getUint16(28, true)).toBe(0); // extra field length
    const nameBytes = out.slice(30, 30 + 9);
    expect(new TextDecoder().decode(nameBytes)).toBe('hello.txt');
  });

  it('exposes CRC-32 known vectors through the local header CRC field', () => {
    // Local header CRC-32 lives at offset 14 (little-endian u32).
    const check = zipStore([{ name: 'n', bytes: enc.encode('123456789') }]);
    const checkView = new DataView(check.buffer, check.byteOffset, check.byteLength);
    expect(checkView.getUint32(14, true)).toBe(0xcbf43926);

    const empty = zipStore([{ name: 'n', bytes: enc.encode('') }]);
    const emptyView = new DataView(empty.buffer, empty.byteOffset, empty.byteLength);
    expect(emptyView.getUint32(14, true)).toBe(0x00000000);
  });

  it('emits one central-directory record per entry whose shared fields match the local header', () => {
    const out = zipStore([
      { name: 'a', bytes: enc.encode('X') },
      { name: 'bb', bytes: enc.encode('YZ') },
    ]);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    // Local blocks: [30 + nameLen + dataLen] each → 32 and 34; CD starts at 66.
    const cdStart = 66;
    const rec2Start = cdStart + 46 + 1; // 46 fixed + name "a"
    expect(view.getUint32(cdStart, true)).toBe(0x02014b50); // 1st central signature
    expect(view.getUint32(rec2Start, true)).toBe(0x02014b50); // 2nd central signature

    // EOCD begins after both central records: rec2 = 46 + 2 ("bb").
    const eocdStart = rec2Start + 46 + 2;
    expect(view.getUint32(eocdStart, true)).toBe(0x06054b50);
    expect(view.getUint16(eocdStart + 8, true)).toBe(2); // total entries this disk
    expect(view.getUint16(eocdStart + 10, true)).toBe(2); // total entries in CD

    // Shared fields: central record 1 vs local header of entry 1 (at offset 0).
    expect(view.getUint16(cdStart + 10, true)).toBe(view.getUint16(8, true)); // method
    expect(view.getUint32(cdStart + 16, true)).toBe(view.getUint32(14, true)); // CRC-32
    expect(view.getUint32(cdStart + 20, true)).toBe(view.getUint32(18, true)); // comp size
    expect(view.getUint32(cdStart + 24, true)).toBe(view.getUint32(22, true)); // uncomp size
    expect(view.getUint16(cdStart + 28, true)).toBe(view.getUint16(26, true)); // name length
    expect(new TextDecoder().decode(out.slice(cdStart + 46, cdStart + 46 + 1))).toBe('a'); // name
  });

  it('records an EOCD whose central-directory offset points at the first central record', () => {
    const out = zipStore([{ name: 'only.bin', bytes: enc.encode('data!') }]);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    // Single local block: 30 + 8 ("only.bin") + 5 ("data!") = 43 → CD at 43.
    const cdStart = 43;
    // Single central record: 46 + 8 = 54 → EOCD at 97.
    const eocdStart = cdStart + 46 + 8;
    expect(view.getUint32(eocdStart, true)).toBe(0x06054b50); // EOCD signature
    const cdSize = view.getUint32(eocdStart + 12, true);
    const cdOffset = view.getUint32(eocdStart + 16, true);
    expect(cdOffset).toBe(cdStart); // offset of CD start from file start
    expect(cdSize).toBe(46 + 8); // size of central directory in bytes
    expect(view.getUint32(cdOffset, true)).toBe(0x02014b50); // offset lands on a central record
  });
});
