import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { tableStore } from './stores/tableStore';
import { prefsStore, DEFAULT_PREFS } from './stores/prefsStore';
import { EMPTY_FILTERS } from './utils/filtering';
import { filterSessions } from './utils/filtering';
import { sortSessions } from './utils/sorting';
import { ALL_COLUMN_KEYS, COLUMNS } from './utils/columns';
import { generateSessions } from './data/fixtures';
import { exportCsv } from './export/csv';

vi.mock('./export/csv');

const mockedExportCsv = vi.mocked(exportCsv);

describe('App export', () => {
  beforeEach(() => {
    localStorage.clear();
    tableStore.setState({ sort: null, filters: EMPTY_FILTERS, visibleColumns: ALL_COLUMN_KEYS });
    prefsStore.setState({ ...DEFAULT_PREFS });
    mockedExportCsv.mockReset();
  });

  it('exports the full filtered+sorted view, ignoring the current page', async () => {
    mockedExportCsv.mockResolvedValue('csv-text');
    render(<App />);

    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'Stadium Steps' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    const expectedRows = sortSessions(
      filterSessions(generateSessions(), { ...EMPTY_FILTERS, routeText: 'Stadium Steps' }),
      null,
    );

    await waitFor(() => expect(mockedExportCsv).toHaveBeenCalledTimes(1));
    expect(mockedExportCsv).toHaveBeenCalledExactlyOnceWith(expectedRows, COLUMNS);
  });
});
