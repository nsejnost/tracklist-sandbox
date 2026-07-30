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

/** Render the worksheet part (`sheet1.xml`) from the workbook model. */
function worksheetXml(wb: Workbook): string {
  const headerCells: readonly Cell[] = wb.header.map(
    (label): Cell => ({ kind: 'string', value: label }),
  );
  const lines: string[] = [rowXml(headerCells, 1)];
  wb.rows.forEach((cells, i) => {
    lines.push(rowXml(cells, i + 2));
  });
  return (
    `${XML_DECL}\n` +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${lines.join('')}</sheetData>` +
    '</worksheet>'
  );
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
  const enc = new TextEncoder();
  return zipStore([
    { name: '[Content_Types].xml', bytes: enc.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', bytes: enc.encode(ROOT_RELS) },
    { name: 'xl/workbook.xml', bytes: enc.encode(WORKBOOK_XML) },
    { name: 'xl/_rels/workbook.xml.rels', bytes: enc.encode(WORKBOOK_RELS) },
    { name: 'xl/worksheets/sheet1.xml', bytes: enc.encode(worksheetXml(wb)) },
  ]);
}
