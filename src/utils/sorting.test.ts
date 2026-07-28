import { describe, expect, it } from 'vitest';
import { sortSessions } from './sorting';
import { makeSession } from '../test/factories';

const rows = [
  makeSession({ id: 1, distanceKm: 12.5, date: '2024-03-01', routeName: 'Canal Towpath', effort: 'race' }),
  makeSession({ id: 2, distanceKm: 5.0, date: '2024-01-15', routeName: 'airport perimeter', effort: 'hard' }),
  makeSession({ id: 3, distanceKm: 21.1, date: '2024-02-10', routeName: 'Botanic Gardens', effort: 'easy' }),
  makeSession({ id: 4, distanceKm: 5.0, date: '2024-04-20', routeName: 'Track Intervals', effort: 'moderate' }),
];

describe('sortSessions', () => {
  it('sorts numeric columns ascending and descending', () => {
    expect(sortSessions(rows, { key: 'distanceKm', direction: 'asc' }).map((r) => r.id)).toEqual([
      2, 4, 1, 3,
    ]);
    // Ties (ids 2 and 4 at 5.0 km) keep input order even when descending.
    expect(sortSessions(rows, { key: 'distanceKm', direction: 'desc' }).map((r) => r.id)).toEqual([
      3, 1, 2, 4,
    ]);
  });

  it('sorts ISO dates chronologically', () => {
    expect(sortSessions(rows, { key: 'date', direction: 'asc' }).map((r) => r.id)).toEqual([
      2, 3, 1, 4,
    ]);
  });

  it('sorts route names case-insensitively', () => {
    expect(sortSessions(rows, { key: 'routeName', direction: 'asc' }).map((r) => r.routeName)).toEqual([
      'airport perimeter',
      'Botanic Gardens',
      'Canal Towpath',
      'Track Intervals',
    ]);
  });

  it('sorts effort by intensity, not alphabetically', () => {
    // Alphabetical would give: easy, hard, moderate, race.
    expect(sortSessions(rows, { key: 'effort', direction: 'asc' }).map((r) => r.effort)).toEqual([
      'easy',
      'moderate',
      'hard',
      'race',
    ]);
  });

  it('keeps original relative order for ties (stable sort)', () => {
    const sorted = sortSessions(rows, { key: 'distanceKm', direction: 'asc' });
    // ids 2 and 4 share distance 5.0; 2 appears first in the input.
    expect(sorted.map((r) => r.id).slice(0, 2)).toEqual([2, 4]);
  });

  it('returns rows unchanged (but copied) when sort is null', () => {
    const result = sortSessions(rows, null);
    expect(result).toEqual(rows);
    expect(result).not.toBe(rows);
  });

  it('never mutates its input', () => {
    const before = rows.map((r) => r.id);
    sortSessions(rows, { key: 'date', direction: 'desc' });
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});
