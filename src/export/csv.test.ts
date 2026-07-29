import { describe, expect, it } from 'vitest';
import type { ColumnDef } from '../types';
import { COLUMNS } from '../utils/columns';
import { makeSession } from '../test/factories';
import { buildCsvSync, CSV_BOM, exportCsv } from './csv';

const DATE_COLUMN: ColumnDef = {
  key: 'date',
  label: 'Date',
  numeric: false,
  format: (s) => s.date,
};

const ROUTE_COLUMN: ColumnDef = {
  key: 'routeName',
  label: 'Route',
  numeric: false,
  format: (s) => s.routeName,
};

describe('buildCsvSync', () => {
  it('starts output with exactly one BOM character', () => {
    const rows = [makeSession({ id: 1 })];
    const csv = buildCsvSync(rows, [DATE_COLUMN]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.indexOf(CSV_BOM)).toBe(0);
    expect(csv.indexOf(CSV_BOM, 1)).toBe(-1);
  });

  it('emits a CRLF-terminated header row of visible labels in column order', () => {
    const csv = buildCsvSync([], [ROUTE_COLUMN, DATE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Route,Date\r\n');
  });

  it('serializes a row through the real column format functions', () => {
    const rows = [
      makeSession({
        id: 1,
        date: '2025-03-14',
        routeName: 'Loop Trail',
        distanceKm: 12.34,
        durationSec: 3661,
        paceSecPerKm: 301,
        effort: 'race',
      }),
    ];
    const csv = buildCsvSync(rows, COLUMNS);
    expect(csv).toBe(
      CSV_BOM +
        'Date,Route,Distance,Duration,Pace,Effort\r\n' +
        '2025-03-14,Loop Trail,12.34 km,1:01:01,5:01 /km,race\r\n',
    );
  });

  it('quotes a field containing a comma', () => {
    const rows = [makeSession({ id: 1, routeName: 'Park, Loop' })];
    const csv = buildCsvSync(rows, [ROUTE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Route\r\n' + '"Park, Loop"\r\n');
  });

  it('doubles an embedded double-quote and quotes the field', () => {
    const rows = [makeSession({ id: 1, routeName: 'The "Big" Loop' })];
    const csv = buildCsvSync(rows, [ROUTE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Route\r\n' + '"The ""Big"" Loop"\r\n');
  });

  it('quotes a field containing an embedded newline and keeps record structure intact', () => {
    const rows = [
      makeSession({ id: 1, routeName: 'Line One\nLine Two' }),
      makeSession({ id: 2, routeName: 'Plain' }),
    ];
    const csv = buildCsvSync(rows, [ROUTE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Route\r\n' + '"Line One\nLine Two"\r\n' + 'Plain\r\n');
  });

  it('leaves plain fields unquoted', () => {
    const rows = [makeSession({ id: 1, routeName: 'Riverside Loop' })];
    const csv = buildCsvSync(rows, [ROUTE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Route\r\n' + 'Riverside Loop\r\n');
  });

  it('emits BOM plus header only for an empty rows array', () => {
    const csv = buildCsvSync([], [DATE_COLUMN, ROUTE_COLUMN]);
    expect(csv).toBe(CSV_BOM + 'Date,Route\r\n');
  });
});

function makeRows(count: number) {
  return Array.from({ length: count }, (_, i) =>
    makeSession({ id: i, routeName: `Route ${i}` }),
  );
}

describe('exportCsv', () => {
  it('resolves byte-identical to buildCsvSync for non-multiple chunk sizes on 10 rows', async () => {
    const rows = makeRows(10);
    const expected = buildCsvSync(rows, [DATE_COLUMN, ROUTE_COLUMN]);
    for (const chunkSize of [1, 3]) {
      const actual = await exportCsv(rows, [DATE_COLUMN, ROUTE_COLUMN], { chunkSize });
      expect(actual).toBe(expected);
    }
  });

  it('yields to the macrotask queue so a competitor queued via setTimeout(0) runs first', async () => {
    const rows = makeRows(5);
    let competitorRan = false;
    const promise = exportCsv(rows, [DATE_COLUMN, ROUTE_COLUMN], { chunkSize: 1 });
    setTimeout(() => {
      competitorRan = true;
    }, 0);
    await promise;
    expect(competitorRan).toBe(true);
  });

  it('reflects the row array as it was at call time, ignoring later mutation', async () => {
    const rows = makeRows(5);
    const originalCsv = buildCsvSync(rows, [DATE_COLUMN, ROUTE_COLUMN]);
    const promise = exportCsv(rows, [DATE_COLUMN, ROUTE_COLUMN], { chunkSize: 1 });
    rows.push(makeSession({ id: 999, routeName: 'Late Addition' }));
    rows.length = 0;
    const resolved = await promise;
    expect(resolved).toBe(originalCsv);
  });

  it('rejects with the same error a throwing column format raises', async () => {
    const boom = new Error('format exploded');
    const throwingColumn: ColumnDef = {
      key: 'routeName',
      label: 'Route',
      numeric: false,
      format: () => {
        throw boom;
      },
    };
    const rows = [makeSession({ id: 1 })];
    expect(() => buildCsvSync(rows, [throwingColumn])).toThrow(boom);
    await expect(exportCsv(rows, [throwingColumn])).rejects.toBe(boom);
  });
});
