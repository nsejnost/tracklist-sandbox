import { beforeEach, describe, expect, it } from 'vitest';
import type { StoreApi } from 'zustand';
import { createTableStore, type TableState } from './tableStore';
import { EMPTY_FILTERS } from '../utils/filtering';
import { ALL_COLUMN_KEYS } from '../utils/columns';

describe('tableStore', () => {
  let store: StoreApi<TableState>;

  beforeEach(() => {
    store = createTableStore();
  });

  it('starts unsorted, unfiltered, with every column visible', () => {
    const state = store.getState();
    expect(state.sort).toBeNull();
    expect(state.filters).toEqual(EMPTY_FILTERS);
    expect(state.visibleColumns).toEqual(ALL_COLUMN_KEYS);
  });

  it('toggleSort sorts ascending first, then flips direction on repeat', () => {
    store.getState().toggleSort('distanceKm');
    expect(store.getState().sort).toEqual({ key: 'distanceKm', direction: 'asc' });
    store.getState().toggleSort('distanceKm');
    expect(store.getState().sort).toEqual({ key: 'distanceKm', direction: 'desc' });
    store.getState().toggleSort('distanceKm');
    expect(store.getState().sort).toEqual({ key: 'distanceKm', direction: 'asc' });
  });

  it('toggleSort on a new column resets to ascending', () => {
    store.getState().toggleSort('date');
    store.getState().toggleSort('date');
    store.getState().toggleSort('effort');
    expect(store.getState().sort).toEqual({ key: 'effort', direction: 'asc' });
  });

  it('filter setters update only their own slice of the filters', () => {
    store.getState().setRouteText('mill');
    store.getState().setEffort('hard');
    store.getState().setDistanceRange(5, 12);
    expect(store.getState().filters).toEqual({
      routeText: 'mill',
      effort: 'hard',
      distanceMinKm: 5,
      distanceMaxKm: 12,
    });
  });

  it('resetFilters restores the empty filter set but keeps sort and columns', () => {
    store.getState().setRouteText('harbor');
    store.getState().toggleSort('date');
    store.getState().toggleColumn('effort');
    store.getState().resetFilters();
    expect(store.getState().filters).toEqual(EMPTY_FILTERS);
    expect(store.getState().sort).toEqual({ key: 'date', direction: 'asc' });
    expect(store.getState().visibleColumns).not.toContain('effort');
  });

  it('toggleColumn hides a visible column and shows a hidden one', () => {
    store.getState().toggleColumn('paceSecPerKm');
    expect(store.getState().visibleColumns).not.toContain('paceSecPerKm');
    store.getState().toggleColumn('paceSecPerKm');
    expect(store.getState().visibleColumns).toContain('paceSecPerKm');
  });

  it('re-showing a column restores canonical column order', () => {
    store.getState().toggleColumn('date');
    store.getState().toggleColumn('date');
    expect(store.getState().visibleColumns).toEqual(ALL_COLUMN_KEYS);
  });

  it('refuses to hide the last visible column', () => {
    for (const key of ALL_COLUMN_KEYS) {
      store.getState().toggleColumn(key);
    }
    expect(store.getState().visibleColumns).toHaveLength(1);
    const last = store.getState().visibleColumns[0]!;
    store.getState().toggleColumn(last);
    expect(store.getState().visibleColumns).toEqual([last]);
  });

  it('showAllColumns restores the full column set', () => {
    store.getState().toggleColumn('date');
    store.getState().toggleColumn('routeName');
    store.getState().showAllColumns();
    expect(store.getState().visibleColumns).toEqual(ALL_COLUMN_KEYS);
  });
});
