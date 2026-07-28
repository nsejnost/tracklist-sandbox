import { describe, expect, it } from 'vitest';
import { generateSessions, SESSION_COUNT } from './fixtures';
import { EFFORTS } from '../types';

describe('generateSessions', () => {
  it('produces the full fixture set of 10,000 rows by default', () => {
    expect(generateSessions()).toHaveLength(SESSION_COUNT);
    expect(SESSION_COUNT).toBe(10_000);
  });

  it('is deterministic: same seed, identical rows', () => {
    expect(generateSessions(200)).toEqual(generateSessions(200));
  });

  it('produces different data for a different seed', () => {
    expect(generateSessions(50, 1)).not.toEqual(generateSessions(50, 2));
  });

  it('assigns sequential unique ids starting at 1', () => {
    const rows = generateSessions(500);
    expect(rows[0]!.id).toBe(1);
    expect(new Set(rows.map((r) => r.id)).size).toBe(500);
    expect(rows[499]!.id).toBe(500);
  });

  it('emits ISO dates in non-decreasing order', () => {
    const rows = generateSessions(300);
    for (const row of rows) {
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const dates = rows.map((r) => r.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('keeps duration consistent with pace and distance', () => {
    for (const row of generateSessions(300)) {
      expect(row.durationSec).toBe(Math.round(row.paceSecPerKm * row.distanceKm));
    }
  });

  it('stays inside plausible ranges and covers every effort level', () => {
    const rows = generateSessions(1000);
    for (const row of rows) {
      expect(row.distanceKm).toBeGreaterThanOrEqual(3);
      expect(row.distanceKm).toBeLessThanOrEqual(21);
      expect(row.paceSecPerKm).toBeGreaterThanOrEqual(225);
      expect(row.paceSecPerKm).toBeLessThanOrEqual(400);
    }
    const seen = new Set(rows.map((r) => r.effort));
    expect([...seen].sort()).toEqual([...EFFORTS].sort());
  });
});
