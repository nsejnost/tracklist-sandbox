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
import { exportXlsx } from './export/xlsx';

vi.mock('./export/csv');
vi.mock('./export/xlsx');

const mockedExportCsv = vi.mocked(exportCsv);
const mockedExportXlsx = vi.mocked(exportXlsx);

describe('App export', () => {
  beforeEach(() => {
    localStorage.clear();
    tableStore.setState({ sort: null, filters: EMPTY_FILTERS, visibleColumns: ALL_COLUMN_KEYS });
    prefsStore.setState({ ...DEFAULT_PREFS });
    mockedExportCsv.mockReset();
    mockedExportXlsx.mockReset();
  });

  it('exports the full filtered+sorted view as CSV, ignoring the current page', async () => {
    mockedExportCsv.mockResolvedValue('csv-text');
    render(<App />);

    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'Stadium Steps' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    const expectedRows = sortSessions(
      filterSessions(generateSessions(), { ...EMPTY_FILTERS, routeText: 'Stadium Steps' }),
      null,
    );

    await waitFor(() => expect(mockedExportCsv).toHaveBeenCalledTimes(1));
    expect(mockedExportCsv).toHaveBeenCalledExactlyOnceWith(expectedRows, COLUMNS);
  });

  it('exports the full filtered+sorted view as XLSX, ignoring the current page', async () => {
    mockedExportXlsx.mockResolvedValue(new Uint8Array([1, 2, 3]));
    render(<App />);

    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'Stadium Steps' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));

    const expectedRows = sortSessions(
      filterSessions(generateSessions(), { ...EMPTY_FILTERS, routeText: 'Stadium Steps' }),
      null,
    );

    await waitFor(() => expect(mockedExportXlsx).toHaveBeenCalledTimes(1));
    expect(mockedExportXlsx).toHaveBeenCalledExactlyOnceWith(expectedRows, COLUMNS);
    expect(mockedExportCsv).not.toHaveBeenCalled();
  });

  it('shows an inline CSV failure on rejection and clears it when export is retried', async () => {
    mockedExportCsv.mockRejectedValueOnce(new Error('boom'));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent(
        'Export failed',
      ),
    );
    expect(screen.getByRole('button', { name: 'Export CSV' })).not.toHaveAttribute('aria-busy');

    // Retrigger with a promise that never settles — this test only asserts
    // that starting a new export clears the prior failure message, not the
    // outcome of the retriggered export (that's covered elsewhere).
    mockedExportCsv.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));

    expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent('');
  });

  it('shows an inline XLSX failure on rejection scoped to the XLSX control', async () => {
    mockedExportXlsx.mockRejectedValueOnce(new Error('boom'));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'XLSX export status' })).toHaveTextContent(
        'Export failed',
      ),
    );
    expect(screen.getByRole('button', { name: 'Export XLSX' })).not.toHaveAttribute('aria-busy');
    // The CSV control is untouched by an XLSX failure.
    expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent('');
  });

  it('keeps the CSV control idle while an XLSX export is in flight, and vice versa', () => {
    mockedExportXlsx.mockReturnValueOnce(new Promise(() => {}));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));
    expect(screen.getByRole('button', { name: /Export XLSX/ })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Export CSV' })).not.toHaveAttribute('aria-busy');

    mockedExportCsv.mockReturnValueOnce(new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(screen.getByRole('button', { name: /Export CSV/ })).toHaveAttribute('aria-busy', 'true');
    // The already-busy XLSX control stays busy; the point is CSV did not seize
    // the XLSX control's busy state and XLSX did not seize CSV's.
    expect(screen.getByRole('button', { name: /Export XLSX/ })).toHaveAttribute(
      'aria-busy',
      'true',
    );
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
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

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

  it('downloads the resolved XLSX bytes as a Blob and revokes the object URL after the click', async () => {
    mockedExportXlsx.mockResolvedValueOnce(new Uint8Array([80, 75, 3, 4]));

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
    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

    expect(createObjectURL).toHaveBeenCalledExactlyOnceWith(expect.any(Blob));
    const [blobArg] = createObjectURL.mock.calls[0] ?? [];
    if (!blobArg) throw new Error('createObjectURL was not called with a Blob');
    expect(blobArg.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(new Uint8Array(await blobArg.arrayBuffer())).toEqual(new Uint8Array([80, 75, 3, 4]));
    expect(clickedHref).toBe('blob:mock-url');
    expect(clickedDownload).toBe('tracklist.xlsx');

    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:mock-url'));
    expect(callOrder).toEqual(['click', 'revoke']);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
