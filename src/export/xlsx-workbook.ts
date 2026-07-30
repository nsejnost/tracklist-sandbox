import type { ColumnDef, RunSession } from '../types';

/** A single typed spreadsheet cell in the in-memory workbook model. */
export type Cell =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string };

/** In-memory typed-cell model for one worksheet — the primary test oracle. */
export interface Workbook {
  readonly sheetName: string;
  readonly header: readonly string[];
  readonly rows: readonly (readonly Cell[])[];
}

/** Header text for a column: verbatim label, except distanceKm -> 'Distance (km)'. */
function headerLabel(col: ColumnDef): string {
  return col.key === 'distanceKm' ? 'Distance (km)' : col.label;
}

/**
 * Typed cell for a column/row pair. `distanceKm` is a number cell carrying the
 * raw numeric value; every other column is a string cell carrying `col.format`.
 */
function cellFor(col: ColumnDef, row: RunSession): Cell {
  if (col.key === 'distanceKm') {
    return { kind: 'number', value: row.distanceKm };
  }
  return { kind: 'string', value: col.format(row) };
}

/**
 * Build the in-memory workbook model: one sheet named `Sheet1`, a header row
 * from the column labels (distanceKm rewritten to `Distance (km)`), then one
 * typed-cell row per session aligned to `columns`.
 */
export function buildWorkbook(
  rows: readonly RunSession[],
  columns: readonly ColumnDef[],
): Workbook {
  return {
    sheetName: 'Sheet1',
    header: columns.map(headerLabel),
    rows: rows.map((row) => columns.map((col) => cellFor(col, row))),
  };
}
