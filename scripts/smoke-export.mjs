// Real-path smoke test (spec R9): exports the full seeded fixture set
// through the real src/export/csv.ts code path under plain Node.
//
// D-0010: the resolve hook must be registered before ANY import (even a
// failed one) touches the src graph — a failed pre-hook import poisons
// Node's module cache and the same specifier keeps failing even after the
// hook registers. So this registration stays at the very top, before any
// import() of anything under src/.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(pathToFileURL(`${import.meta.dirname}/resolve-ts-hook.mjs`).href, import.meta.url);

const { generateSessions } = await import('../src/data/fixtures');
const { COLUMNS } = await import('../src/utils/columns');
const { exportCsv } = await import('../src/export/csv');

function fail(message) {
  console.error(`csv:fail ${message}`);
  process.exit(1);
}

const rows = generateSessions();
// exportCsv (never buildCsvSync — that oracle is banned outside src/export/)
// is what the app actually calls, so it's what this smoke test must exercise.
const text = await exportCsv(rows, COLUMNS);

// (b) first char is the UTF-8 BOM.
if (text[0] !== '﻿') {
  fail(`expected leading BOM, got ${JSON.stringify(text[0])}`);
}

// (d) the text ends with CRLF.
if (!text.endsWith('\r\n')) {
  fail('expected text to end with CRLF');
}

const withoutBom = text.slice(1);
const headerEnd = withoutBom.indexOf('\r\n');
if (headerEnd === -1) {
  fail('no CRLF-terminated header line found');
}

// (c) header line, BOM stripped, equals the COLUMNS labels comma-joined.
const headerLine = withoutBom.slice(0, headerEnd);
const expectedHeader = COLUMNS.map((c) => c.label).join(',');
if (headerLine !== expectedHeader) {
  fail(`header mismatch: expected ${JSON.stringify(expectedHeader)}, got ${JSON.stringify(headerLine)}`);
}

// (a) CRLF-terminated records after the header line = 10,000 exactly.
const body = withoutBom.slice(headerEnd + 2);
const recordCount = body === '' ? 0 : (body.match(/\r\n/g) ?? []).length;
if (recordCount !== 10_000) {
  fail(`expected 10000 CRLF-terminated records after header, got ${recordCount}`);
}

console.log('csv:ok rows=10000');
