import { describe, expect, it } from 'vitest';
import { zipStore } from './zip';

const enc = new TextEncoder();

describe('Unit', () => {
  it('opens with the local file header signature PK\\x03\\x04', () => {
    const out = zipStore([{ name: 'a.txt', bytes: enc.encode('hi') }]);
    expect([out[0], out[1], out[2], out[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
