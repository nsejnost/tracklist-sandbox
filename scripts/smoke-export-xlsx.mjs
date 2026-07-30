// Real-path smoke test (spec R9, xlsx): exports the full seeded fixture set
// through the real src/export/xlsx.ts code path under plain Node and
// structurally validates the workbook bytes, dependency-free (no zip/xlsx
// parser library).
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
const { serializeXlsx } = await import('../src/export/xlsx');

function fail(message) {
  console.error(`xlsx:fail ${message}`);
  process.exit(1);
}

// serializeXlsx is the synchronous real serializer (#03); it returns the
// .xlsx bytes as a Uint8Array.
const bytes = serializeXlsx(generateSessions(), COLUMNS);

if (!(bytes instanceof Uint8Array)) {
  fail(`expected a Uint8Array, got ${Object.prototype.toString.call(bytes)}`);
}

// ZIP magic bytes: the file starts with PK\x03\x04.
if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
  fail('expected ZIP magic bytes PK\\x03\\x04 at start of file');
}

// Entries are STORED (compression method 0), so the raw bytes decode verbatim
// as latin1/binary text.
const text = Buffer.from(bytes).toString('latin1');

// Both part names must appear (they show up in local + central headers).
if (!text.includes('[Content_Types].xml')) {
  fail('part name [Content_Types].xml not found in archive');
}
if (!text.includes('xl/worksheets/sheet1.xml')) {
  fail('part name xl/worksheets/sheet1.xml not found in archive');
}

// The worksheet XML (sheet1.xml content) sits verbatim between <worksheet and
// </worksheet>, appearing once.
const start = text.indexOf('<worksheet');
const endMarker = '</worksheet>';
const end = text.indexOf(endMarker);
if (start === -1 || end === -1 || end < start) {
  fail('could not locate <worksheet ...</worksheet> content in archive');
}
const worksheet = text.slice(start, end + endMarker.length);

// Count <row elements: 1 header row + 10,000 data rows = 10,001 total.
const totalRows = (worksheet.match(/<row /g) ?? []).length;
const dataRows = totalRows - 1;
if (dataRows !== 10_000) {
  fail(`expected 10000 data rows, got ${dataRows} (total <row occurrences: ${totalRows})`);
}

console.log('xlsx:ok rows=10000');
