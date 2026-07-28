import type { Effort, RunSession } from '../types';

export interface Filters {
  /** Case-insensitive substring match against the route name. */
  routeText: string;
  effort: Effort | 'all';
  distanceMinKm: number | null;
  distanceMaxKm: number | null;
}

export const EMPTY_FILTERS: Filters = {
  routeText: '',
  effort: 'all',
  distanceMinKm: null,
  distanceMaxKm: null,
};

export function matchesFilters(session: RunSession, filters: Filters): boolean {
  const text = filters.routeText.trim().toLowerCase();
  if (text !== '' && !session.routeName.toLowerCase().includes(text)) return false;
  if (filters.effort !== 'all' && session.effort !== filters.effort) return false;
  if (filters.distanceMinKm !== null && session.distanceKm < filters.distanceMinKm) return false;
  if (filters.distanceMaxKm !== null && session.distanceKm > filters.distanceMaxKm) return false;
  return true;
}

export function filterSessions(rows: readonly RunSession[], filters: Filters): RunSession[] {
  return rows.filter((row) => matchesFilters(row, filters));
}
