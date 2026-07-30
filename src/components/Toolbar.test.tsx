import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Toolbar } from './Toolbar';

type ExportStatus = 'idle' | 'exporting' | 'error';

function renderToolbar(
  props: {
    csvStatus?: ExportStatus;
    xlsxStatus?: ExportStatus;
    onExportCsv?: () => void;
    onExportXlsx?: () => void;
  } = {},
) {
  const {
    csvStatus = 'idle',
    xlsxStatus = 'idle',
    onExportCsv = vi.fn(),
    onExportXlsx = vi.fn(),
  } = props;
  return render(
    <Toolbar
      onRefresh={vi.fn()}
      refreshing={false}
      matchCount={0}
      totalCount={0}
      onExportCsv={onExportCsv}
      csvStatus={csvStatus}
      onExportXlsx={onExportXlsx}
      xlsxStatus={xlsxStatus}
    />,
  );
}

describe('Toolbar', () => {
  it('renders an Export CSV button beside an Export XLSX button', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export XLSX' })).toBeInTheDocument();
  });

  it('reflects csvStatus as busy state and inline failure text on the CSV control', () => {
    const { rerender } = renderToolbar({ csvStatus: 'idle' });
    const csvButton = screen.getByRole('button', { name: 'Export CSV' });
    expect(csvButton).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent('');

    rerender(
      <Toolbar
        onRefresh={vi.fn()}
        refreshing={false}
        matchCount={0}
        totalCount={0}
        onExportCsv={vi.fn()}
        csvStatus="exporting"
        onExportXlsx={vi.fn()}
        xlsxStatus="idle"
      />,
    );
    // When busy, the Spinner's "Loading" label joins the button's accessible
    // name (the shipped busy-button precedent), so narrow with a regex.
    const busyButton = screen.getByRole('button', { name: /Export CSV/ });
    expect(busyButton).toHaveAttribute('aria-busy', 'true');
    expect(busyButton).toBeDisabled();
    expect(within(busyButton).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent('');

    rerender(
      <Toolbar
        onRefresh={vi.fn()}
        refreshing={false}
        matchCount={0}
        totalCount={0}
        onExportCsv={vi.fn()}
        csvStatus="error"
        onExportXlsx={vi.fn()}
        xlsxStatus="idle"
      />,
    );
    expect(screen.getByRole('button', { name: 'Export CSV' })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: 'CSV export status' })).toHaveTextContent(
      'Export failed',
    );
  });

  it('reflects xlsxStatus as busy state and inline failure text on the XLSX control', () => {
    const { rerender } = renderToolbar({ xlsxStatus: 'idle' });
    const xlsxButton = screen.getByRole('button', { name: 'Export XLSX' });
    expect(xlsxButton).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: 'XLSX export status' })).toHaveTextContent('');

    rerender(
      <Toolbar
        onRefresh={vi.fn()}
        refreshing={false}
        matchCount={0}
        totalCount={0}
        onExportCsv={vi.fn()}
        csvStatus="idle"
        onExportXlsx={vi.fn()}
        xlsxStatus="error"
      />,
    );
    expect(screen.getByRole('button', { name: 'Export XLSX' })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: 'XLSX export status' })).toHaveTextContent(
      'Export failed',
    );
  });

  it('marks only the busy control aria-busy, leaving the other export control idle', () => {
    renderToolbar({ csvStatus: 'idle', xlsxStatus: 'exporting' });
    // Busy XLSX button carries the "Loading" spinner label, so match by regex;
    // the idle CSV button keeps its exact name.
    expect(screen.getByRole('button', { name: /Export XLSX/ })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Export CSV' })).not.toHaveAttribute('aria-busy');
  });
});
