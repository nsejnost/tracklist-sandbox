import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsTable } from './ResultsTable';
import { COLUMNS } from '../utils/columns';
import { makeSession } from '../test/factories';

const rows = [
  makeSession({ id: 1, routeName: 'Harbor Esplanade', distanceKm: 12.34, durationSec: 3661, paceSecPerKm: 297 }),
  makeSession({ id: 2, routeName: 'Old Mill Trail', distanceKm: 5, durationSec: 1505, paceSecPerKm: 301 }),
];

const noop = () => undefined;

describe('ResultsTable', () => {
  it('renders one header per provided column', () => {
    render(<ResultsTable rows={rows} columns={COLUMNS} sort={null} onSortChange={noop} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(COLUMNS.length);
    expect(screen.getByRole('columnheader', { name: 'Route' })).toBeInTheDocument();
  });

  it('omits columns that are not passed in', () => {
    const withoutEffort = COLUMNS.filter((c) => c.key !== 'effort');
    render(<ResultsTable rows={rows} columns={withoutEffort} sort={null} onSortChange={noop} />);
    expect(screen.queryByRole('columnheader', { name: 'Effort' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Duration' })).toBeInTheDocument();
  });

  it('renders cells through each column formatter', () => {
    render(<ResultsTable rows={rows} columns={COLUMNS} sort={null} onSortChange={noop} />);
    expect(screen.getByText('Harbor Esplanade')).toBeInTheDocument();
    expect(screen.getByText('12.34 km')).toBeInTheDocument();
    expect(screen.getByText('1:01:01')).toBeInTheDocument();
    expect(screen.getByText('5:01 /km')).toBeInTheDocument();
  });

  it('reports the clicked column through onSortChange', () => {
    const onSortChange = vi.fn();
    render(<ResultsTable rows={rows} columns={COLUMNS} sort={null} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Distance' }));
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith('distanceKm');
  });

  it('marks the active sort column via aria-sort and an indicator', () => {
    render(
      <ResultsTable
        rows={rows}
        columns={COLUMNS}
        sort={{ key: 'durationSec', direction: 'desc' }}
        onSortChange={noop}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /Duration/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'Route' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('shows an empty state when no rows match', () => {
    render(<ResultsTable rows={[]} columns={COLUMNS} sort={null} onSortChange={noop} />);
    expect(screen.getByText('No sessions match the current filters.')).toBeInTheDocument();
  });

  it('applies the requested density class', () => {
    render(
      <ResultsTable rows={rows} columns={COLUMNS} sort={null} onSortChange={noop} density="compact" />,
    );
    expect(screen.getByRole('table')).toHaveClass('density-compact');
  });
});
