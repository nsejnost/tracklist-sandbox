import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '../types';
import { COLUMNS } from '../utils/columns';
import { makeSession } from '../test/factories';
import { buildWorkbook, serializeXlsx } from './xlsx';

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

/** Locate a column by key from the real COLUMNS registry. */
function col(key: string): ColumnDef {
  const found = COLUMNS.find((c) => c.key === key);
  if (!found) throw new Error(`no column ${key}`);
  return found;
}

/** Decode the packed sheet1.xml worksheet part out of the zip bytes. */
function worksheetText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

describe('Unit', () => {
  it('names the single sheet Sheet1', () => {
    const wb = buildWorkbook([], COLUMNS);
    expect(wb.sheetName).toBe('Sheet1');
  });

  it('rewrites only distanceKm header to Distance (km), other labels verbatim', () => {
    const wb = buildWorkbook([], COLUMNS);
    expect(wb.header).toEqual([
      'Date',
      'Route',
      'Distance (km)',
      'Duration',
      'Pace',
      'Effort',
    ]);
  });

  it('distanceKm is a number cell holding the raw value, not the formatted km string', () => {
    const row = makeSession({ id: 1, distanceKm: 10.4 });
    const wb = buildWorkbook([row], [col('distanceKm')]);
    const cell = wb.rows[0]?.[0];
    expect(cell).toEqual({ kind: 'number', value: 10.4 });
  });

  it('date is a string cell holding col.format output', () => {
    const row = makeSession({ id: 1, date: '2025-03-14' });
    const wb = buildWorkbook([row], [col('date')]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: '2025-03-14' });
  });

  it('routeName is a string cell holding col.format output', () => {
    const row = makeSession({ id: 1, routeName: 'Loop Trail' });
    const wb = buildWorkbook([row], [col('routeName')]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: 'Loop Trail' });
  });

  it('durationSec is a string cell (despite numeric:true) holding the formatted time', () => {
    const row = makeSession({ id: 1, durationSec: 3661 });
    const wb = buildWorkbook([row], [col('durationSec')]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: '1:01:01' });
  });

  it('paceSecPerKm is a string cell (despite numeric:true) holding the formatted pace', () => {
    const row = makeSession({ id: 1, paceSecPerKm: 301 });
    const wb = buildWorkbook([row], [col('paceSecPerKm')]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: '5:01 /km' });
  });

  it('effort is a string cell holding col.format output', () => {
    const row = makeSession({ id: 1, effort: 'race' });
    const wb = buildWorkbook([row], [col('effort')]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: 'race' });
  });

  it('cell kind is keyed on col.key, not col.numeric: a numeric:true non-distance col stays string', () => {
    const fakeNumeric: ColumnDef = {
      key: 'routeName',
      label: 'Route',
      numeric: true,
      format: () => 'text-value',
    };
    const row = makeSession({ id: 1 });
    const wb = buildWorkbook([row], [fakeNumeric]);
    expect(wb.rows[0]?.[0]).toEqual({ kind: 'string', value: 'text-value' });
  });

  it('emits one model row per session aligned to columns', () => {
    const rows = [makeSession({ id: 1 }), makeSession({ id: 2 }), makeSession({ id: 3 })];
    const wb = buildWorkbook(rows, COLUMNS);
    expect(wb.rows).toHaveLength(3);
    expect(wb.rows[0]).toHaveLength(COLUMNS.length);
  });

  it('serialized bytes begin with the ZIP local-file-header magic', () => {
    const rows = [makeSession({ id: 1 })];
    const out = serializeXlsx(rows, COLUMNS);
    expect([out[0], out[1], out[2], out[3]]).toEqual(ZIP_MAGIC);
  });

  it('packs the content-types and worksheet parts by name into the zip', () => {
    const out = serializeXlsx([makeSession({ id: 1 })], COLUMNS);
    const text = worksheetText(out);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('xl/worksheets/sheet1.xml');
  });

  it('writes distanceKm data cells as numbers with no t attribute and raw value', () => {
    const row = makeSession({ id: 1, distanceKm: 10.4 });
    const out = serializeXlsx([row], [col('distanceKm')]);
    const text = worksheetText(out);
    // header row 1 is a string cell, data row 2 col A is the number cell.
    expect(text).toContain('<c r="A2"><v>10.4</v></c>');
  });

  it('writes string data cells as inlineStr with escaped text', () => {
    const row = makeSession({ id: 1, routeName: 'Loop' });
    const out = serializeXlsx([row], [col('routeName')]);
    const text = worksheetText(out);
    expect(text).toContain('<c r="A2" t="inlineStr"><is><t>Loop</t></is></c>');
  });

  it('XML-escapes & and < in string content and never emits them raw', () => {
    const row = makeSession({ id: 1, routeName: 'A & B < C' });
    const out = serializeXlsx([row], [col('routeName')]);
    const text = worksheetText(out);
    expect(text).toContain('A &amp; B &lt; C');
    expect(text).not.toContain('A & B');
    expect(text).not.toContain('B < C');
  });

  it('numbers rows: header is row 1, first session is row 2', () => {
    const out = serializeXlsx([makeSession({ id: 1 })], COLUMNS);
    const text = worksheetText(out);
    expect(text).toContain('<row r="1">');
    expect(text).toContain('<row r="2">');
  });
});
