import type { RunSession, ColumnDef } from '../types';
import type { Cell, Workbook } from './xlsx-workbook';
import { buildWorkbook } from './xlsx-workbook';
import { zipStore } from './zip';

export type { Cell, Workbook };
export { buildWorkbook };

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const CONTENT_TYPES =
  `${XML_DECL}\n` +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
  '<Default Extension="xml" ContentType="application/xml"/>\n' +
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n' +
  '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n' +
  '</Types>';

const ROOT_RELS =
  `${XML_DECL}\n` +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n' +
  '</Relationships>';

const WORKBOOK_XML =
  `${XML_DECL}\n` +
  '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n' +
  '<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>\n' +
  '</workbook>';

const WORKBOOK_RELS =
  `${XML_DECL}\n` +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n' +
  '</Relationships>';

/** Escape XML element-content special characters (`&`, `<`, `>`). */
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 0-based column index -> spreadsheet column letters (0->A, 25->Z, 26->AA). */
function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Serialize one cell to its `<c>` element at the given A1-style reference. */
function cellXml(cell: Cell, ref: string): string {
  if (cell.kind === 'number') {
    return `<c r="${ref}"><v>${String(cell.value)}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell.value)}</t></is></c>`;
}

/** Serialize one `<row>` element from a list of cells at 1-based row number. */
function rowXml(cells: readonly Cell[], rowNumber: number): string {
  const inner = cells
    .map((cell, i) => cellXml(cell, `${columnLetter(i)}${rowNumber}`))
    .join('');
  return `<row r="${rowNumber}">${inner}</row>`;
}

/** Render the header `<row>` (row 1) from the worksheet header labels. */
function headerRowXml(header: readonly string[]): string {
  const headerCells: readonly Cell[] = header.map(
    (label): Cell => ({ kind: 'string', value: label }),
  );
  return rowXml(headerCells, 1);
}

/** Wrap the header row and accumulated data-row XML into the worksheet part. */
function worksheetXml(headerRow: string, dataRows: string): string {
  return (
    `${XML_DECL}\n` +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${headerRow}${dataRows}</sheetData>` +
    '</worksheet>'
  );
}

/**
 * Assemble the five-part OOXML package around a worksheet part as UTF-8 and
 * pack it into a stored-entry ZIP. The single source of truth for the output
 * bytes, shared by `serializeXlsx` and `exportXlsx`.
 */
function packWorkbook(worksheet: string): Uint8Array {
  const enc = new TextEncoder();
  return zipStore([
    { name: '[Content_Types].xml', bytes: enc.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', bytes: enc.encode(ROOT_RELS) },
    { name: 'xl/workbook.xml', bytes: enc.encode(WORKBOOK_XML) },
    { name: 'xl/_rels/workbook.xml.rels', bytes: enc.encode(WORKBOOK_RELS) },
    { name: 'xl/worksheets/sheet1.xml', bytes: enc.encode(worksheet) },
  ]);
}

/**
 * Build the workbook model, render the minimal five-part OOXML package as
 * UTF-8, and pack it into a stored-entry ZIP. Synchronous and dependency-free.
 */
export function serializeXlsx(
  rows: readonly RunSession[],
  columns: readonly ColumnDef[],
): Uint8Array {
  const wb = buildWorkbook(rows, columns);
  const dataRows = wb.rows.map((cells, i) => rowXml(cells, i + 2)).join('');
  return packWorkbook(worksheetXml(headerRowXml(wb.header), dataRows));
}

/** Options for {@link exportXlsx}. */
export interface ExportXlsxOptions {
  /** Rows processed per macrotask before yielding. Defaults to 500. */
  chunkSize?: number;
}

const DEFAULT_CHUNK_SIZE = 500;

function yieldToMacrotaskQueue(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Build the same xlsx package as `serializeXlsx`, processing rows in chunks
 * and yielding to the macrotask queue between them so the caller stays
 * responsive on large exports. Snapshots both argument arrays synchronously
 * at call time — later mutation/replacement of the caller's arrays does not
 * affect the in-flight export.
 */
export async function exportXlsx(
  rows: readonly RunSession[],
  columns: readonly ColumnDef[],
  opts?: ExportXlsxOptions,
): Promise<Uint8Array> {
  const rowsSnapshot = [...rows];
  const columnsSnapshot = [...columns];
  const chunkSize = opts?.chunkSize ?? DEFAULT_CHUNK_SIZE;

  const header = buildWorkbook([], columnsSnapshot).header;
  let dataRows = '';

  for (let start = 0; start < rowsSnapshot.length; start += chunkSize) {
    const chunk = buildWorkbook(rowsSnapshot.slice(start, start + chunkSize), columnsSnapshot);
    chunk.rows.forEach((cells, i) => {
      dataRows += rowXml(cells, start + i + 2);
    });
    if (start + chunkSize < rowsSnapshot.length) {
      await yieldToMacrotaskQueue();
    }
  }

  return packWorkbook(worksheetXml(headerRowXml(header), dataRows));
}
