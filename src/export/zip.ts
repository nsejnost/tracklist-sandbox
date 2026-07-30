/** A single named part to be stored (uncompressed) in the ZIP container. */
export interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

const LOCAL_HEADER_SIG = 0x04034b50;
const CENTRAL_HEADER_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

const VERSION_NEEDED = 20;
const GP_FLAG_UTF8 = 0x0800;
const METHOD_STORED = 0;
/** Fixed MS-DOS timestamp (1980-01-01 00:00) so output is deterministic. */
const DOS_TIME = 0x0000;
const DOS_DATE = 0x0021;

const LOCAL_HEADER_FIXED = 30;
const CENTRAL_HEADER_FIXED = 46;
const EOCD_FIXED = 22;

/** Precomputed CRC-32 lookup table for the reflected polynomial 0xEDB88320. */
const CRC_TABLE: readonly number[] = (() => {
  const table = new Array<number>(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) >>> 0 : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * CRC-32 (reflected poly 0xEDB88320) over `bytes`, pre-conditioned to
 * 0xFFFFFFFF and post-conditioned by XOR 0xFFFFFFFF. Returns an unsigned
 * 32-bit integer.
 */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i] ?? 0;
    const idx = (crc ^ byte) & 0xff;
    crc = ((crc >>> 8) ^ (CRC_TABLE[idx] ?? 0)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** One entry's precomputed metadata, shared between local and central records. */
interface EntryMeta {
  nameBytes: Uint8Array;
  bytes: Uint8Array;
  crc: number;
  offset: number;
}

function writeLocalHeader(view: DataView, u8: Uint8Array, off: number, meta: EntryMeta): number {
  view.setUint32(off, LOCAL_HEADER_SIG, true);
  view.setUint16(off + 4, VERSION_NEEDED, true);
  view.setUint16(off + 6, GP_FLAG_UTF8, true);
  view.setUint16(off + 8, METHOD_STORED, true);
  view.setUint16(off + 10, DOS_TIME, true);
  view.setUint16(off + 12, DOS_DATE, true);
  view.setUint32(off + 14, meta.crc, true);
  view.setUint32(off + 18, meta.bytes.length, true);
  view.setUint32(off + 22, meta.bytes.length, true);
  view.setUint16(off + 26, meta.nameBytes.length, true);
  view.setUint16(off + 28, 0, true);
  u8.set(meta.nameBytes, off + LOCAL_HEADER_FIXED);
  const dataOff = off + LOCAL_HEADER_FIXED + meta.nameBytes.length;
  u8.set(meta.bytes, dataOff);
  return dataOff + meta.bytes.length;
}

function writeCentralHeader(view: DataView, u8: Uint8Array, off: number, meta: EntryMeta): number {
  view.setUint32(off, CENTRAL_HEADER_SIG, true);
  view.setUint16(off + 4, VERSION_NEEDED, true);
  view.setUint16(off + 6, VERSION_NEEDED, true);
  view.setUint16(off + 8, GP_FLAG_UTF8, true);
  view.setUint16(off + 10, METHOD_STORED, true);
  view.setUint16(off + 12, DOS_TIME, true);
  view.setUint16(off + 14, DOS_DATE, true);
  view.setUint32(off + 16, meta.crc, true);
  view.setUint32(off + 20, meta.bytes.length, true);
  view.setUint32(off + 24, meta.bytes.length, true);
  view.setUint16(off + 28, meta.nameBytes.length, true);
  view.setUint16(off + 30, 0, true);
  view.setUint16(off + 32, 0, true);
  view.setUint16(off + 34, 0, true);
  view.setUint16(off + 36, 0, true);
  view.setUint32(off + 38, 0, true);
  view.setUint32(off + 42, meta.offset, true);
  u8.set(meta.nameBytes, off + CENTRAL_HEADER_FIXED);
  return off + CENTRAL_HEADER_FIXED + meta.nameBytes.length;
}

/**
 * Pack already-serialized parts into a valid `.zip` container using
 * stored/uncompressed entries only (compression method 0). Builds local file
 * headers + data, then the central directory, then the EOCD record, with a
 * hand-rolled CRC-32. Pure function; dependency-free.
 */
export function zipStore(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const metas: EntryMeta[] = [];

  let localSize = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    metas.push({ nameBytes, bytes: entry.bytes, crc: crc32(entry.bytes), offset: 0 });
    localSize += LOCAL_HEADER_FIXED + nameBytes.length + entry.bytes.length;
    centralSize += CENTRAL_HEADER_FIXED + nameBytes.length;
  }

  const total = localSize + centralSize + EOCD_FIXED;
  const u8 = new Uint8Array(total);
  const view = new DataView(u8.buffer);

  let off = 0;
  for (const meta of metas) {
    meta.offset = off;
    off = writeLocalHeader(view, u8, off, meta);
  }

  const centralStart = off;
  for (const meta of metas) {
    off = writeCentralHeader(view, u8, off, meta);
  }

  view.setUint32(off, EOCD_SIG, true);
  view.setUint16(off + 4, 0, true);
  view.setUint16(off + 6, 0, true);
  view.setUint16(off + 8, metas.length, true);
  view.setUint16(off + 10, metas.length, true);
  view.setUint32(off + 12, centralSize, true);
  view.setUint32(off + 16, centralStart, true);
  view.setUint16(off + 20, 0, true);

  return u8;
}
