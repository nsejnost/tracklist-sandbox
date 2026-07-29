# Spec — csv-export

Status: FROZEN — SPEC gate passed 2026-07-29T03:40Z (Auditor 5/5, 0 trace flags). Novelty → icebox.md, never this file.
Sources: CHARTER.md · decisions.md D-0001..D-0016 (evidence: notes/csv-interop.md,
notes/chunked-export-proto.md). Every requirement cites its trace. Seam
signatures are normative — tickets and tests copy them verbatim.

## Problem

Someone using the results table can see exactly the slice they care about —
filters applied, a sort order chosen, columns picked — but cannot take it out
of the app. The arc succeeds when what they're currently looking at leaves the
app as a CSV file that opens in any spreadsheet program, works at 10,000 rows
without freezing the UI, and changes nothing about how the table behaves
today. (Charter §Destination.)

## Solution

A DOM-free export engine `src/export/csv.ts` (ADR D-0007) serializes the
current view — rows in current sort order, restricted to visible columns —
to RFC-4180-profile CSV text (D-0001..0004), in chunks that yield the main
thread (D-0008/0009). A ghost "Export" button in the toolbar's second row
(D-0013..0015) drives it through App-owned transient state (D-0011/0012) and
delivers the text as a `tracklist.csv` download via Blob → object URL →
anchor click (D-0005, D-0007 line 7). A plain-Node smoke script pushes the
full 10,000-row fixture set through the same engine (D-0010).

## Seams (TDD happens here and only here)

- S1 `src/export/csv.ts` (new; fixed by D-0007):
  `buildCsvSync(rows: readonly RunSession[], columns: readonly ColumnDef[]): string`
  · `exportCsv(rows: readonly RunSession[], columns: readonly ColumnDef[], opts?: ExportCsvOptions): Promise<string>`
  · `interface ExportCsvOptions { chunkSize?: number }` (default 500, non-exported)
  · `const CSV_BOM = "\uFEFF"`.
  `buildCsvSync` is the test oracle — banned outside `src/export/`
  (`grep -rn buildCsvSync src scripts | grep -v src/export` → empty).
- S2 Component props/roles (existing pattern; delta fixed here per D-0011/
  D-0012/D-0014): `ToolbarProps` grows exactly
  `{ onExport: () => void; exportStatus: 'idle' | 'exporting' | 'error' }`;
  Button `busy`/`aria-busy` drive the in-progress state; the error region is
  an ALWAYS-MOUNTED `role="status"` `aria-live="polite"` element at row-2 end
  whose text is "" or "Export failed"; the Blob/object-URL/anchor/revoke
  wiring lives inline in App.tsx (D-0011 "no new file"); accessible names via
  testing-library role queries.
- S3 `scripts/smoke-export.mjs` stdout + exit code.
No other seams. Tests never observe internals (chunk buffers, yield timing
except through S1's public behavior).

## Requirements

Each requirement: statement · trace · executable acceptance. Global gates
(charter Done-when) close the arc; per-requirement lines are the build/TICKETS
acceptance currency.

**R1 — CSV text policy.** `buildCsvSync` emits: `CSV_BOM` as first char
(D-0004), one header row from the passed columns' labels (D-0001), one line
per row in array order with cells from each column's `format(row)` (charter
WYSIWYG), RFC-minimal quoting — quote only fields containing comma, quote,
CR, or LF; escape `"` by doubling (D-0002) — and CRLF terminating every
record including the last (D-0003). Empty rows array → BOM + header line only
(D-0006). Column subset and order = exactly the `columns` argument.
Trace: D-0001..0006, §Silence-defaults(Export fidelity).
Acceptance: `npx vitest run src/export/` → exit 0; tests T1–T8 below present.

**R2 — Chunked driver identity + responsiveness.** `exportCsv` resolves
byte-identical to `buildCsvSync` for the same arguments (any chunkSize ≥ 1,
row counts that are not multiples of chunkSize included). Between chunks it
yields macrotask-class (D-0009). Snapshot-at-call: it shallow-copies both
argument arrays synchronously at entry; replacing/mutating the caller's
arrays after the call does not affect the in-flight export (D-0007 line 6).
Trace: D-0007 lines 2/5/6, D-0008, D-0009, §Destination(no freezing).
Acceptance: identity test T9, interleaving test T10 (with `chunkSize: 1`, a
`setTimeout(0)` competitor queued at call time runs before the promise
resolves), snapshot test T11 — all in `npx vitest run src/export/` → exit 0.

**R3 — Plain-Node loadability.** The engine has no DOM references and only
`import type` from src, so plain Node loads it directly.
Trace: D-0007 line 3.
Acceptance: `node --input-type=module -e "import('./src/export/csv.ts').then(m => { if (typeof m.exportCsv !== 'function' || typeof m.buildCsvSync !== 'function') throw new Error('missing exports'); console.log('load:ok'); })"`
→ prints `load:ok`, exit 0.

**R4 — Export trigger in the toolbar.** A `Button` labeled "Export" (D-0013),
`variant` ghost (D-0015), in toolbar row 2 after Refresh (D-0014). Clicking
it exports the CURRENT view: the filtered+sorted rows array and visible
columns that App already derives (D-0011 — captured at click; paging
ignored per §Glossary(view)).
Trace: §Scope-In(trigger), D-0011, D-0013..0015.
Acceptance: `npm test` → exit 0 with new Toolbar/App tests T13–T14 (button
present by role+name; click passes App's current sorted/filtered rows and
visible columns into the export path).

**R5 — In-progress state.** While the export promise is pending the control
shows the existing busy pattern: `busy` Button → `aria-busy="true"`,
Spinner, disabled. Busy ends on settle; rejection settles into 'error'
(D-0012) — 'idle' is reached only after a resolve or a retrigger-clear.
Trace: §Scope-In, §Glossary(in-progress state), D-0011/D-0012.
Acceptance: test T15 (busy during pending, terminal state per settle) in `npm test`
→ exit 0.

**R6 — Inline failure state.** On rejection the control's own adjacent
element (`role="status"`, `aria-live="polite"`, at row end per D-0014) shows
exactly "Export failed" (D-0016); no toast/notification machinery; the
message clears when a new export starts (D-0012 clear-on-retrigger).
Trace: §Scope-In(failure inline), §Scope-Out(no notifications), D-0012,
D-0016.
Acceptance: test T16 (reject → exact text visible in the status element;
retrigger → text gone) in `npm test` → exit 0.

**R7 — Download delivery.** On resolve, the UI constructs exactly
`new Blob([text], { type: "text/csv;charset=utf-8" })` (no extra parts —
engine is the sole BOM writer, D-0007 line 4), creates an object URL, clicks
an anchor with `download="tracklist.csv"` (D-0005), and revokes the URL on
a deferred schedule — after the click has been dispatched (D-0007 line 7
"deferred revoke").
Trace: §Tech constraints(download path), D-0005, D-0007 lines 4/7.
Acceptance: test T17 (URL.createObjectURL/revokeObjectURL and anchor
download attribute observed via test doubles; Blob args exact) in `npm test`
→ exit 0.

**R8 — Zero regression to the existing table.** No existing test file
changes; all 63 baseline tests pass unmodified; no change to sorting,
filtering, paging, column picking, or prefs persistence; no-touch zones
untouched.
Trace: §Priorities 1, §Scope-Out, §No-touch, §Quality invariants.
Acceptance: `npm test` → exit 0 with ≥75 total tests and the 10 baseline
files unmodified (`git diff --name-only origin/main` on each ticket branch
shows no existing `src/**/*.test.*` file); `npm run typecheck` → exit 0;
`npm run build` → exit 0 and `du -sk dist/` ≤ 230.

**R9 — Smoke script.** `scripts/smoke-export.mjs`: registers the ~14-line
resolve hook via `module.register()` BEFORE any src import (D-0010), loads
the real `generateSessions()`, real `COLUMNS`, real `exportCsv`, exports all
10,000 rows, verifies (a) CRLF-terminated records after the header line =
10,000 exactly, (b) first char is `\uFEFF`, (c) the header line — leading
`\uFEFF` stripped — equals the COLUMNS labels comma-joined, (d) the text
ends with CRLF, then prints exactly `csv:ok rows=10000` and exits 0;
any failure → nonzero exit with a diagnostic line. Plus exactly one line
documenting the command in README's existing Commands section.
Trace: §Scope-In(smoke), §Done-when 5, D-0010, D-0007 line 7.
Acceptance: `node scripts/smoke-export.mjs` → prints `csv:ok rows=10000`,
exit 0; `grep -c smoke-export README.md` → 1.

## Testing decisions

Export-core tests (S1, `src/export/csv.test.ts`, oracle = `buildCsvSync`,
expected strings as `CSV_BOM + "..."`/`\uFEFF` escapes — never pasted
invisible literals; rows via `makeSession`):
- T1 BOM: output starts with `\uFEFF`, exactly once.
- T2 Header: visible labels, comma-joined, CRLF-terminated (subset + order
  respected when a column list is passed).
- T3 WYSIWYG cells: a `makeSession` row serializes through the real COLUMNS
  format functions (`"12.34 km"`, `"1:01:01"`, `"5:01 /km"` style values).
- T4 Quoting — comma: synthetic `routeName` containing a comma is quoted.
- T5 Quoting — double-quote: `"` doubled and field quoted.
- T6 Quoting — embedded newline: field quoted, record structure intact.
- T7 Unquoted plain fields stay unquoted (RFC-minimal, not always-quote).
- T8 Empty view: `buildCsvSync([], columns)` = BOM + header line only.
- T9 Identity: `await exportCsv(rows, columns, {chunkSize: k})` ===
  `buildCsvSync(rows, columns)` for k ∈ {1, 3} with 10 rows (non-multiple).
- T10 Interleaving: `chunkSize: 1`, ≥3 rows — a competitor queued with
  `setTimeout(0)` at call time observably runs before resolution.
- T11 Snapshot-at-call: mutate/replace the source array right after calling;
  resolved CSV reflects the original.
- T12 Failure path: a column whose `format` throws → `buildCsvSync` throws
  and `exportCsv` rejects with the same error (real seam, no internal
  mocking). T1–T12 = the 12 required export tests (Done-when 1).
UI tests (S2, in NEW test files only — `src/components/Toolbar.test.tsx`
(new) and `src/App.export.test.tsx` (new); existing test files are frozen
per R8 — testing-library role queries, `vi.fn()` + exact-arg assertions):
T13 button by role+name "Export"; T14 click exports current view — the test
first narrows the view via a route filter to a known fixture subset, then
asserts exact rows/columns args; T15 busy semantics; T16 failure inline +
clear-on-retrigger; T17 download wiring with exact Blob args.
Sanctioned doubles (documented exceptions to the no-internals rule, scoped
to these files): App-level tests double the engine via
`vi.mock('./export/csv')` (exported-function seam); T17 uses
`vi.stubGlobal` for `URL.createObjectURL`/`revokeObjectURL` and
`vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})`
(jsdom implements neither createObjectURL nor navigation).
Timers: export and UI export tests run under REAL timers — never
`vi.useFakeTimers` (the chunked yield and T10 depend on real macrotasks).
While busy, two `role="status"` nodes coexist (Spinner + error region):
queries disambiguate by accessible name or `within()`.
Conventions: per codingstandards.md (factories, role queries, exact strings,
no `.skip`/`.todo`, behavior-only seams). Engine failure-path tests may use a
throwing `format` function as the error source (real seam, no internal
mocking).

## Implementation decisions (ledger)

D-0001..0006 text policy · D-0007 (ADR) seam + 7 contract lines · D-0008
chunk 500 · D-0009 macrotask yield · D-0010 hook confined to smoke ·
D-0011 App-useState state home · D-0012 idle/exporting/error + status
element · D-0013 "Export" · D-0014 row-2 placement · D-0015 ghost ·
D-0016 "Export failed". Rollback paths: see D-0007.

## Out of scope (charter Scope-Out + icebox, verbatim authority: charter)

XLSX (icebox: next-arc candidate) · PDF/other formats · any backend ·
toasts/notification system · copy-to-clipboard · export-settings UI
(filename/delimiter/quoting choosers) · keyboard shortcuts · telemetry ·
i18n beyond en-US · lint/format/git-hook tooling · refactors beyond the
export seam · dependency changes of any kind · README beyond the one
Commands line · any change to existing table behavior (sorting, filtering,
paging, column picking, prefs persistence) · onProgress/AbortSignal on the
engine (D-0007: additive later) · persistence of export state
(§Silence-defaults: transient only; `tracklist.prefs.v1` frozen).
