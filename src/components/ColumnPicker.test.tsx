import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnPicker } from './ColumnPicker';
import { COLUMNS, ALL_COLUMN_KEYS } from '../utils/columns';

function renderPicker(visible = ALL_COLUMN_KEYS) {
  const onToggle = vi.fn();
  const onShowAll = vi.fn();
  render(
    <ColumnPicker columns={COLUMNS} visible={visible} onToggle={onToggle} onShowAll={onShowAll} />,
  );
  return { onToggle, onShowAll };
}

describe('ColumnPicker', () => {
  it('keeps the menu closed until the trigger is clicked', () => {
    renderPicker();
    expect(screen.queryByRole('group', { name: 'Visible columns' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(screen.getByRole('group', { name: 'Visible columns' })).toBeInTheDocument();
  });

  it('summarises how many columns are visible on the trigger', () => {
    renderPicker(['date', 'routeName']);
    expect(screen.getByRole('button', { name: `Columns (2/${COLUMNS.length})` })).toBeInTheDocument();
  });

  it('checks exactly the currently visible columns', () => {
    renderPicker(['date', 'distanceKm']);
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    expect(screen.getByRole('checkbox', { name: 'Date' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Distance' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Effort' })).not.toBeChecked();
  });

  it('reports toggles and show-all through its callbacks', () => {
    const { onToggle, onShowAll } = renderPicker(['date']);
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pace' }));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith('paceSecPerKm');
    fireEvent.click(screen.getByRole('button', { name: 'Show all' }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});
