import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration, formatPace } from './format';

describe('formatDuration', () => {
  it('formats minutes and zero-pads seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(754)).toBe('12:34');
  });

  it('rolls over into hours with zero-padded minutes', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(4515)).toBe('1:15:15');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});

describe('formatPace', () => {
  it('renders seconds-per-km as a per-km pace', () => {
    expect(formatPace(331)).toBe('5:31 /km');
  });
});

describe('formatDistance', () => {
  it('always shows two decimals with a unit', () => {
    expect(formatDistance(10.4)).toBe('10.40 km');
    expect(formatDistance(5)).toBe('5.00 km');
  });
});
