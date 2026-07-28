export const EFFORTS = ['easy', 'moderate', 'hard', 'race'] as const;

export type Effort = (typeof EFFORTS)[number];

/** One recorded running session. */
export interface RunSession {
  id: number;
  /** ISO date, e.g. "2025-11-30" */
  date: string;
  routeName: string;
  distanceKm: number;
  durationSec: number;
  /** Derived: durationSec / distanceKm, rounded to whole seconds. */
  paceSecPerKm: number;
  effort: Effort;
}

export type ColumnKey = keyof Omit<RunSession, 'id'>;

export type SortDirection = 'asc' | 'desc';

export interface SortSpec {
  key: ColumnKey;
  direction: SortDirection;
}

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  numeric: boolean;
  format: (session: RunSession) => string;
}
