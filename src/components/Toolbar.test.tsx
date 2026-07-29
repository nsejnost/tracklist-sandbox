import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Toolbar } from './Toolbar';

function renderToolbar(exportStatus: 'idle' | 'exporting' | 'error', onExport = vi.fn()) {
  return render(
    <Toolbar
      onRefresh={vi.fn()}
      refreshing={false}
      matchCount={0}
      totalCount={0}
      onExport={onExport}
      exportStatus={exportStatus}
    />,
  );
}

describe('Toolbar', () => {
  it('renders an Export button', () => {
    renderToolbar('idle');
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('reflects exportStatus as busy state and inline failure text', () => {
    const { rerender } = renderToolbar('idle');
    const exportButton = screen.getByRole('button', { name: 'Export' });
    expect(exportButton).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('');

    rerender(
      <Toolbar
        onRefresh={vi.fn()}
        refreshing={false}
        matchCount={0}
        totalCount={0}
        onExport={vi.fn()}
        exportStatus="exporting"
      />,
    );
    const busyButton = screen.getByRole('button', { name: /Export/ });
    expect(busyButton).toHaveAttribute('aria-busy', 'true');
    expect(busyButton).toBeDisabled();
    expect(within(busyButton).getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('');

    rerender(
      <Toolbar
        onRefresh={vi.fn()}
        refreshing={false}
        matchCount={0}
        totalCount={0}
        onExport={vi.fn()}
        exportStatus="error"
      />,
    );
    expect(screen.getByRole('button', { name: 'Export' })).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Export failed');
  });
});
