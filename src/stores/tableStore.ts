import { createStore, useStore, type StoreApi } from 'zustand';
import type { ColumnKey, Effort, SortSpec } from '../types';
import { ALL_COLUMN_KEYS } from '../utils/columns';
import { EMPTY_FILTERS, type Filters } from '../utils/filtering';

export interface TableState {
  sort: SortSpec | null;
  filters: Filters;
  visibleColumns: readonly ColumnKey[];
  /** First click sorts asc; clicking the active column flips direction. */
  toggleSort: (key: ColumnKey) => void;
  setRouteText: (routeText: string) => void;
  setEffort: (effort: Effort | 'all') => void;
  setDistanceRange: (minKm: number | null, maxKm: number | null) => void;
  resetFilters: () => void;
  /** No-op when it would hide the last visible column. */
  toggleColumn: (key: ColumnKey) => void;
  showAllColumns: () => void;
}

export function createTableStore(): StoreApi<TableState> {
  return createStore<TableState>()((set) => ({
    sort: null,
    filters: EMPTY_FILTERS,
    visibleColumns: ALL_COLUMN_KEYS,
    toggleSort: (key) =>
      set((state) => ({
        sort:
          state.sort?.key === key
            ? { key, direction: state.sort.direction === 'asc' ? 'desc' : 'asc' }
            : { key, direction: 'asc' },
      })),
    setRouteText: (routeText) => set((state) => ({ filters: { ...state.filters, routeText } })),
    setEffort: (effort) => set((state) => ({ filters: { ...state.filters, effort } })),
    setDistanceRange: (distanceMinKm, distanceMaxKm) =>
      set((state) => ({ filters: { ...state.filters, distanceMinKm, distanceMaxKm } })),
    resetFilters: () => set({ filters: EMPTY_FILTERS }),
    toggleColumn: (key) =>
      set((state) => {
        if (state.visibleColumns.includes(key)) {
          if (state.visibleColumns.length === 1) return state;
          return { visibleColumns: state.visibleColumns.filter((k) => k !== key) };
        }
        // Re-derive from the canonical list so column order stays fixed.
        const next = new Set([...state.visibleColumns, key]);
        return { visibleColumns: ALL_COLUMN_KEYS.filter((k) => next.has(k)) };
      }),
    showAllColumns: () => set({ visibleColumns: ALL_COLUMN_KEYS }),
  }));
}

export const tableStore = createTableStore();

export function useTableStore<T>(selector: (state: TableState) => T): T {
  return useStore(tableStore, selector);
}
