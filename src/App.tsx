import { useEffect, useMemo, useRef, useState } from 'react';
import { generateSessions } from './data/fixtures';
import { useTableStore } from './stores/tableStore';
import { usePrefsStore } from './stores/prefsStore';
import { filterSessions } from './utils/filtering';
import { sortSessions } from './utils/sorting';
import { COLUMNS } from './utils/columns';
import { Button } from './components/Button';
import { Toolbar } from './components/Toolbar';
import { ResultsTable } from './components/ResultsTable';
import { exportCsv } from './export/csv';
import type { RunSession } from './types';

export default function App() {
  const [sessions, setSessions] = useState<RunSession[]>(() => generateSessions());
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'error'>('idle');
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const filters = useTableStore((s) => s.filters);
  const sort = useTableStore((s) => s.sort);
  const toggleSort = useTableStore((s) => s.toggleSort);
  const visibleColumns = useTableStore((s) => s.visibleColumns);

  const pageSize = usePrefsStore((s) => s.pageSize);
  const density = usePrefsStore((s) => s.density);

  const filtered = useMemo(() => filterSessions(sessions, filters), [sessions, filters]);
  const sorted = useMemo(() => sortSessions(filtered, sort), [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => sorted.slice(clampedPage * pageSize, (clampedPage + 1) * pageSize),
    [sorted, clampedPage, pageSize],
  );

  const columns = useMemo(
    () => COLUMNS.filter((c) => visibleColumns.includes(c.key)),
    [visibleColumns],
  );

  useEffect(() => {
    setPage(0);
  }, [filters, sort, pageSize]);

  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  const refresh = () => {
    setRefreshing(true);
    refreshTimer.current = setTimeout(() => {
      setSessions(generateSessions());
      setRefreshing(false);
    }, 400);
  };

  const handleExport = () => {
    setExportStatus('exporting');
    const viewRows = sorted;
    const viewColumns = columns;
    exportCsv(viewRows, viewColumns).then(
      (text) => {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'tracklist.csv';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        setExportStatus('idle');
      },
      () => {
        setExportStatus('error');
      },
    );
  };

  return (
    <main className="app">
      <header className="app-header">
        <h1>tracklist</h1>
        <p>Running sessions, sortable and filterable.</p>
      </header>
      <Toolbar
        onRefresh={refresh}
        refreshing={refreshing}
        matchCount={sorted.length}
        totalCount={sessions.length}
        onExport={handleExport}
        exportStatus={exportStatus}
      />
      <ResultsTable
        rows={pageRows}
        columns={columns}
        sort={sort}
        onSortChange={toggleSort}
        density={density}
      />
      <nav className="pager" aria-label="Pagination">
        <Button disabled={clampedPage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          Previous
        </Button>
        <span>
          Page {clampedPage + 1} of {pageCount}
        </span>
        <Button
          disabled={clampedPage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        >
          Next
        </Button>
      </nav>
    </main>
  );
}
