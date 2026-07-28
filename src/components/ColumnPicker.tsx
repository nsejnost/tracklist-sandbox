import { useEffect, useRef, useState } from 'react';
import type { ColumnDef, ColumnKey } from '../types';
import { Button } from './Button';

export interface ColumnPickerProps {
  columns: readonly ColumnDef[];
  visible: readonly ColumnKey[];
  onToggle: (key: ColumnKey) => void;
  onShowAll: () => void;
}

/** Dropdown of checkboxes controlling which table columns are shown. */
export function ColumnPicker({ columns, visible, onToggle, onShowAll }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div className="column-picker" ref={rootRef}>
      <Button aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Columns ({visible.length}/{columns.length})
      </Button>
      {open && (
        <div className="column-picker-menu" role="group" aria-label="Visible columns">
          {columns.map((column) => (
            <label key={column.key} className="column-picker-item">
              <input
                type="checkbox"
                checked={visible.includes(column.key)}
                onChange={() => onToggle(column.key)}
              />
              {column.label}
            </label>
          ))}
          <Button className="column-picker-all" onClick={onShowAll}>
            Show all
          </Button>
        </div>
      )}
    </div>
  );
}
