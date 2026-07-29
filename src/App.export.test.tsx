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

  it('shows an inline failure on rejection and clears it when export is retried', async () => {
    mockedExportCsv.mockRejectedValueOnce(new Error('boom'));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() =>
      expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Export failed'),
    );
    expect(screen.getByRole('button', { name: 'Export' })).not.toHaveAttribute('aria-busy');

    // Retrigger with a promise that never settles — this test only asserts
    // that starting a new export clears the prior failure message, not the
    // outcome of the retriggered export (that's covered elsewhere).
    mockedExportCsv.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: /Export/ }));

    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('');
  });

  it('downloads the resolved CSV as a Blob and revokes the object URL after the click', async () => {
    mockedExportCsv.mockResolvedValueOnce('csv-text');

    const callOrder: string[] = [];
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock-url');
    const revokeObjectURL = vi.fn(() => {
      callOrder.push('revoke');
    });
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    let clickedHref: string | undefined;
    let clickedDownload: string | undefined;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        callOrder.push('click');
        clickedHref = this.href;
        clickedDownload = this.download;
      });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(expect.any(Blob));
    const [blobArg] = createObjectURL.mock.calls[0] ?? [];
    if (!blobArg) throw new Error('createObjectURL was not called with a Blob');
    expect(blobArg.type).toBe('text/csv;charset=utf-8');
    expect(await blobArg.text()).toBe('csv-text');
    expect(clickedHref).toBe('blob:mock-url');
    expect(clickedDownload).toBe('tracklist.csv');

    // Revocation is deferred to after the click dispatch, not synchronous with
    // it — proved by call order rather than a timing snapshot, since real
    // timers make "not yet called" racy against waitFor's own polling.
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:mock-url'));
    expect(callOrder).toEqual(['click', 'revoke']);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
