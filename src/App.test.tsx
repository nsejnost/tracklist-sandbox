import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { tableStore } from './stores/tableStore';
import { prefsStore, DEFAULT_PREFS, PREFS_STORAGE_KEY } from './stores/prefsStore';
import { EMPTY_FILTERS } from './utils/filtering';
import { ALL_COLUMN_KEYS } from './utils/columns';

describe('App integration', () => {
  beforeEach(() => {
    localStorage.clear();
    tableStore.setState({ sort: null, filters: EMPTY_FILTERS, visibleColumns: ALL_COLUMN_KEYS });
    prefsStore.setState({ ...DEFAULT_PREFS });
  });

  it('renders the first page of the full fixture set', () => {
    render(<App />);
    expect(screen.getByText('10,000 of 10,000 sessions')).toBeInTheDocument();
    // 50 data rows (default page size) plus the header row.
    expect(screen.getAllByRole('row')).toHaveLength(51);
    expect(screen.getByText('Page 1 of 200')).toBeInTheDocument();
  });

  it('filters from the toolbar down to the table', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Route'), { target: { value: 'zzz-no-such-route' } });
    expect(screen.getByText('0 of 10,000 sessions')).toBeInTheDocument();
    expect(screen.getByText('No sessions match the current filters.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
    expect(screen.getByText('10,000 of 10,000 sessions')).toBeInTheDocument();
  });

  it('pages forward and back through the results', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Page 2 of 200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('sorts via the column headers', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Date' }));
    expect(screen.getByRole('columnheader', { name: /Date/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    fireEvent.click(screen.getByRole('button', { name: /Date/ }));
    expect(screen.getByRole('columnheader', { name: /Date/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('hides a column from the picker', () => {
    render(<App />);
    expect(screen.getByRole('columnheader', { name: 'Pace' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pace' }));
    expect(screen.queryByRole('columnheader', { name: 'Pace' })).not.toBeInTheDocument();
  });

  it('persists a page-size change through the prefs store', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '25' } });
    expect(screen.getAllByRole('row')).toHaveLength(26);
    expect(screen.getByText('Page 1 of 400')).toBeInTheDocument();
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).prefs.pageSize).toBe(25);
  });
});
