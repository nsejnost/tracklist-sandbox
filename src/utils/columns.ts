import type { ColumnDef, ColumnKey } from '../types';
import { formatDistance, formatDuration, formatPace } from './format';

export const COLUMNS: readonly ColumnDef[] = [
  { key: 'date', label: 'Date', numeric: false, format: (s) => s.date },
  { key: 'routeName', label: 'Route', numeric: false, format: (s) => s.routeName },
  {
    key: 'distanceKm',
    label: 'Distance',
    numeric: true,
    format: (s) => formatDistance(s.distanceKm),
  },
  {
    key: 'durationSec',
    label: 'Duration',
    numeric: true,
    format: (s) => formatDuration(s.durationSec),
  },
  { key: 'paceSecPerKm', label: 'Pace', numeric: true, format: (s) => formatPace(s.paceSecPerKm) },
  { key: 'effort', label: 'Effort', numeric: false, format: (s) => s.effort },
];

export const ALL_COLUMN_KEYS: readonly ColumnKey[] = COLUMNS.map((c) => c.key);
