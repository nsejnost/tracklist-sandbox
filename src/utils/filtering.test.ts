import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, filterSessions } from './filtering';
import { makeSession } from '../test/factories';

const rows = [
  makeSession({ id: 1, routeName: 'Riverside Loop', distanceKm: 5.2, effort: 'easy' }),
  makeSession({ id: 2, routeName: 'Old Mill Trail', distanceKm: 10.0, effort: 'hard' }),
  makeSession({ id: 3, routeName: 'Harbor Esplanade', distanceKm: 15.4, effort: 'easy' }),
  makeSession({ id: 4, routeName: 'Ridgeline Traverse', distanceKm: 21.1, effort: 'race' }),
];

describe('filterSessions', () => {
  it('returns everything for the empty filter set', () => {
    expect(filterSessions(rows, EMPTY_FILTERS)).toEqual(rows);
  });

  it('matches route text case-insensitively as a substring', () => {
    expect(filterSessions(rows, { ...EMPTY_FILTERS, routeText: 'mill' }).map((r) => r.id)).toEqual([2]);
    expect(filterSessions(rows, { ...EMPTY_FILTERS, routeText: 'R' })).toHaveLength(4);
  });

  it('trims surrounding whitespace from the text query', () => {
    expect(filterSessions(rows, { ...EMPTY_FILTERS, routeText: '  harbor  ' }).map((r) => r.id)).toEqual([3]);
  });

  it('filters by effort level', () => {
    expect(filterSessions(rows, { ...EMPTY_FILTERS, effort: 'easy' }).map((r) => r.id)).toEqual([1, 3]);
  });

  it('applies min-only, max-only, and combined distance bounds inclusively', () => {
    expect(filterSessions(rows, { ...EMPTY_FILTERS, distanceMinKm: 10 }).map((r) => r.id)).toEqual([
      2, 3, 4,
    ]);
    expect(filterSessions(rows, { ...EMPTY_FILTERS, distanceMaxKm: 10 }).map((r) => r.id)).toEqual([
      1, 2,
    ]);
    expect(
      filterSessions(rows, { ...EMPTY_FILTERS, distanceMinKm: 6, distanceMaxKm: 16 }).map((r) => r.id),
    ).toEqual([2, 3]);
  });

  it('combines text, effort, and range filters with AND semantics', () => {
    const result = filterSessions(rows, {
      routeText: 'e',
      effort: 'easy',
      distanceMinKm: 6,
      distanceMaxKm: null,
    });
    expect(result.map((r) => r.id)).toEqual([3]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterSessions(rows, { ...EMPTY_FILTERS, routeText: 'volcano' })).toEqual([]);
  });
});
