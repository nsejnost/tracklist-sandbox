import type { ColumnDef, ColumnKey, RunSession, SortSpec } from '../types';

export interface ResultsTableProps {
  rows: readonly RunSession[];
  columns: readonly ColumnDef[];
  sort: SortSpec | null;
  onSortChange: (key: ColumnKey) => void;
  density?: 'comfortable' | 'compact';
}

/**
 * Presentational results table. Everything it shows arrives via props, so it
 * can be rendered (and tested) without any store.
 */
export function ResultsTable({
  rows,
  columns,
  sort,
  onSortChange,
  density = 'comfortable',
}: ResultsTableProps) {
  return (
    <table className={`results-table density-${density}`}>
      <thead>
        <tr>
          {columns.map((column) => {
            const direction = sort !== null && sort.key === column.key ? sort.direction : null;
            return (
              <th
                key={column.key}
                aria-sort={direction === null ? undefined : direction === 'asc' ? 'ascending' : 'descending'}
                className={column.numeric ? 'numeric' : ''}
              >
                <button type="button" className="th-button" onClick={() => onSortChange(column.key)}>
                  {column.label}
                  {direction !== null && (
                    <span aria-hidden="true"> {direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className="empty-state" colSpan={columns.length}>
              No sessions match the current filters.
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key} className={column.numeric ? 'numeric' : ''}>
                  {column.format(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
