import { useTableStore } from '../stores/tableStore';
import { usePrefsStore, DENSITIES, PAGE_SIZES, type PageSize } from '../stores/prefsStore';
import { COLUMNS } from '../utils/columns';
import { EFFORTS } from '../types';
import type { Effort } from '../types';
import { Button } from './Button';
import { ColumnPicker } from './ColumnPicker';

export interface ToolbarProps {
  onRefresh: () => void;
  refreshing: boolean;
  matchCount: number;
  totalCount: number;
  onExportCsv: () => void;
  csvStatus: 'idle' | 'exporting' | 'error';
  onExportXlsx: () => void;
  xlsxStatus: 'idle' | 'exporting' | 'error';
}

function parseKm(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function Toolbar({
  onRefresh,
  refreshing,
  matchCount,
  totalCount,
  onExportCsv,
  csvStatus,
  onExportXlsx,
  xlsxStatus,
}: ToolbarProps) {
  const filters = useTableStore((s) => s.filters);
  const setRouteText = useTableStore((s) => s.setRouteText);
  const setEffort = useTableStore((s) => s.setEffort);
  const setDistanceRange = useTableStore((s) => s.setDistanceRange);
  const resetFilters = useTableStore((s) => s.resetFilters);
  const visibleColumns = useTableStore((s) => s.visibleColumns);
  const toggleColumn = useTableStore((s) => s.toggleColumn);
  const showAllColumns = useTableStore((s) => s.showAllColumns);

  const pageSize = usePrefsStore((s) => s.pageSize);
  const setPageSize = usePrefsStore((s) => s.setPageSize);
  const density = usePrefsStore((s) => s.density);
  const setDensity = usePrefsStore((s) => s.setDensity);

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <label className="field">
          Route
          <input
            type="search"
            placeholder="Filter by route…"
            value={filters.routeText}
            onChange={(e) => setRouteText(e.target.value)}
          />
        </label>
        <label className="field">
          Effort
          <select
            value={filters.effort}
            onChange={(e) => setEffort(e.target.value as Effort | 'all')}
          >
            <option value="all">all</option>
            {EFFORTS.map((effort) => (
              <option key={effort} value={effort}>
                {effort}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Min km
          <input
            type="number"
            min={0}
            step={0.5}
            value={filters.distanceMinKm ?? ''}
            onChange={(e) => setDistanceRange(parseKm(e.target.value), filters.distanceMaxKm)}
          />
        </label>
        <label className="field">
          Max km
          <input
            type="number"
            min={0}
            step={0.5}
            value={filters.distanceMaxKm ?? ''}
            onChange={(e) => setDistanceRange(filters.distanceMinKm, parseKm(e.target.value))}
          />
        </label>
        <Button onClick={resetFilters}>Reset filters</Button>
        <span className="toolbar-count" aria-live="polite">
          {matchCount.toLocaleString('en-US')} of {totalCount.toLocaleString('en-US')} sessions
        </span>
      </div>
      <div className="toolbar-row">
        <ColumnPicker
          columns={COLUMNS}
          visible={visibleColumns}
          onToggle={toggleColumn}
          onShowAll={showAllColumns}
        />
        <label className="field">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Density
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value as (typeof DENSITIES)[number])}
          >
            {DENSITIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" busy={refreshing} onClick={onRefresh}>
          Refresh
        </Button>
        <Button variant="ghost" busy={csvStatus === 'exporting'} onClick={onExportCsv}>
          Export CSV
        </Button>
        <span
          className="toolbar-export-status"
          role="status"
          aria-live="polite"
          aria-label="CSV export status"
        >
          {csvStatus === 'error' ? 'Export failed' : ''}
        </span>
        <Button variant="ghost" busy={xlsxStatus === 'exporting'} onClick={onExportXlsx}>
          Export XLSX
        </Button>
        <span
          className="toolbar-export-status"
          role="status"
          aria-live="polite"
          aria-label="XLSX export status"
        >
          {xlsxStatus === 'error' ? 'Export failed' : ''}
        </span>
      </div>
    </div>
  );
}
