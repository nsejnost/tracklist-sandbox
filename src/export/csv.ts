import type { ColumnDef, RunSession } from '../types';

/** UTF-8 byte-order mark prefixed to every exported CSV for spreadsheet interop. */
export const CSV_BOM = '\uFEFF';

const CRLF = '\r\n';

/** Quote a CSV field only when RFC 4180 requires it; double any embedded quotes. */
function quoteField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildRow(cells: readonly string[]): string {
  return cells.map(quoteField).join(',') + CRLF;
}

/** Build the BOM-prefixed header row shared by `buildCsvSync` and `exportCsv`. */
function csvHeader(columns: readonly ColumnDef[]): string {
  return CSV_BOM + buildRow(columns.map((c) => c.label));
}

/**
 * Build a CSV document synchronously: BOM, header row from `columns` labels,
 * then one row per `rows` entry using each column's `format`. This is the
 * test oracle for the export engine — do not import it outside src/export/.
 */
export function buildCsvSync(rows: readonly RunSession[], columns: readonly ColumnDef[]): string {
  let out = csvHeader(columns);
  for (const row of rows) {
    out += buildRow(columns.map((c) => c.format(row)));
  }
  return out;
}

/** Options for {@link exportCsv}. */
export interface ExportCsvOptions {
  /** Rows processed per macrotask before yielding. Defaults to 500. */
  chunkSize?: number;
}

const DEFAULT_CHUNK_SIZE = 500;

function yieldToMacrotaskQueue(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Build the same CSV document as `buildCsvSync`, processing rows in chunks
 * and yielding to the macrotask queue between them so the caller stays
 * responsive on large exports. Snapshots both argument arrays synchronously
 * at call time — later mutation/replacement of the caller's arrays does not
 * affect the in-flight export.
 */
export async function exportCsv(
  rows: readonly RunSession[],
  columns: readonly ColumnDef[],
  opts?: ExportCsvOptions,
): Promise<string> {
  const rowsSnapshot = [...rows];
  const columnsSnapshot = [...columns];
  const chunkSize = opts?.chunkSize ?? DEFAULT_CHUNK_SIZE;

  let out = csvHeader(columnsSnapshot);

  for (let start = 0; start < rowsSnapshot.length; start += chunkSize) {
    const chunk = rowsSnapshot.slice(start, start + chunkSize);
    for (const row of chunk) {
      out += buildRow(columnsSnapshot.map((c) => c.format(row)));
    }
    if (start + chunkSize < rowsSnapshot.length) {
      await yieldToMacrotaskQueue();
    }
  }

  return out;
}
