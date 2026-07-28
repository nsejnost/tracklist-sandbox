import type { Effort, RunSession, SortSpec } from '../types';
import { EFFORTS } from '../types';

// Efforts sort by intensity, not alphabetically.
const EFFORT_RANK: Record<Effort, number> = Object.fromEntries(
  EFFORTS.map((effort, i) => [effort, i]),
) as Record<Effort, number>;

function compareBy(key: SortSpec['key'], a: RunSession, b: RunSession): number {
  switch (key) {
    case 'date':
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    case 'routeName':
      return a.routeName.localeCompare(b.routeName);
    case 'distanceKm':
      return a.distanceKm - b.distanceKm;
    case 'durationSec':
      return a.durationSec - b.durationSec;
    case 'paceSecPerKm':
      return a.paceSecPerKm - b.paceSecPerKm;
    case 'effort':
      return EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort];
  }
}

/**
 * Return a new array sorted by `sort`; the input is never mutated. A null
 * sort returns the rows in their original order. Ties keep their original
 * relative order (Array.prototype.sort is stable).
 */
export function sortSessions(rows: readonly RunSession[], sort: SortSpec | null): RunSession[] {
  if (sort === null) return [...rows];
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => sign * compareBy(sort.key, a, b));
}
