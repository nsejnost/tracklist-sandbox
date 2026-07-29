# Decisions — csv-export (append-only)

D-0001 | 2026-07-29 | #05 | Header row: exactly one, built from the currently visible columns' labels | charter §Silence-defaults(Export fidelity): "headers from the visible column labels (WYSIWYG)" — direct answer
D-0002 | 2026-07-29 | #05 | Quoting: RFC-minimal — quote only fields containing comma, quote, CR, or LF; escape quotes by doubling; others unquoted | Type 2; §Silence-defaults(1)→(2) + Priority 2 via RFC 4180 canonical rule; exact-string tests make it one-ticket reversible
D-0003 | 2026-07-29 | #05 | Line endings: CRLF between records; every record incl. the last terminated with CRLF (uniform terminator) | Type 2; §Silence-defaults(1) no precedent → Priority 2 (RFC 4180 CRLF, accepted by all §Destination targets); uniform shape suits chunked writer
D-0004 | 2026-07-29 | #05 | BOM: emit UTF-8 BOM (EF BB BF) as first bytes | Type 2; silence-default tie → §Priorities via §Destination "opens in any spreadsheet program": BOM is Microsoft's documented double-click path, no evidence of harm in targets; trivially reversible
D-0005 | 2026-07-29 | #05 | Filename: static "tracklist.csv", fixed at build time | Type 2; §Silence-defaults(2) smallest reversible + novel-copy rule (nearest pattern = app name); §Scope-Out(no settings UI) confirms fixity; deterministic for tests
D-0006 | 2026-07-29 | #05 | Empty view: export succeeds → header-row-only CSV | charter §Glossary("view" = all rows matching filters — zero rows is a valid view; "export" = writing the view) + §Silence-defaults(WYSIWYG: empty-state message is presentation, not row data) — direct answer

## D-0007 (ADR) — Export engine seam: src/export/csv.ts, sync oracle + chunked async driver
Ticket: #04   Date: 2026-07-29   Status: accepted
Context: Tickets 06 (exact-string TDD), 07 (UI trigger), 08 (plain-Node smoke)
copy this seam verbatim; reshaping it later reworks all three. The choice also
fixes the DOM boundary (which side chunking, BOM, and download live on) — the
boundary that lets one code path serve browser and Node. Cross-ticket +
boundary-setting → Type 1.
Evidence: notes/csv-interop.md (§4 yield primitives, §5/§5a Node type-stripping
and the tsconfig/extension pinch); notes/chunked-export-proto.md (chunked ≡
naive byte-identical at 250/500/1000; naive blocks 56 ms; chunked max slice
2.0–7.1 ms; hook-free load of a type-only-import engine; register-before-import
rule). Ledger D-0001..0006 fix all byte-level questions.
Decision: module `src/export/csv.ts`, named exports exactly:
`buildCsvSync(rows: readonly RunSession[], columns: readonly ColumnDef[]): string`
· `exportCsv(rows: readonly RunSession[], columns: readonly ColumnDef[], opts?: ExportCsvOptions): Promise<string>`
· `interface ExportCsvOptions { chunkSize?: number }` (default 500, non-exported constant)
· `const CSV_BOM = "\uFEFF"`.
Contract: (1) `buildCsvSync` is the test oracle; `Sync` suffix load-bearing;
doc-comment warns it blocks ~56 ms at 10k rows; BANNED outside src/export/ —
review guard `grep -rn buildCsvSync src scripts | grep -v src/export` must be
empty. (2) `exportCsv` resolves byte-identical to `buildCsvSync`; failure =
throw/reject; busy = promise pending; no onProgress/AbortSignal in v1
(additive later via opts). (3) 06 acceptance includes a plain-Node load probe:
`node --input-type=module -e "import('./src/export/csv.ts').then(m => { if (typeof m.exportCsv !== 'function' || typeof m.buildCsvSync !== 'function') throw new Error('missing exports'); console.log('load:ok'); })"`
→ prints `load:ok` (mechanically enforces DOM-free + `import type`-only, which
the no-touch tsconfig cannot). (4) The engine is the ONLY BOM writer: both
functions return CSV_BOM as first char; consumers never prepend; 07 constructs
`new Blob([text], { type: "text/csv;charset=utf-8" })` with no extra parts;
test convention: expected strings written `CSV_BOM + "..."` or the `\uFEFF` escape
— pasted invisible literals are a review-reject. (5) 06's ≥12 tests include
one black-box interleaving test: with `chunkSize: 1` and ≥3 rows, a queued
`setTimeout(0)` competitor runs before `exportCsv` resolves; a microtask-only
yield must fail it. (6) Snapshot-at-call: `exportCsv` shallow-copies both
argument arrays synchronously at entry, never re-reads stores; later
replacement/mutation of caller arrays does not affect an in-flight export (row
objects not cloned, per replace-not-mutate store convention); 06 asserts by
mutating the source array after the call. (7) Blob/object-URL/anchor/deferred
revoke + filename tracklist.csv (D-0005) live in 07's UI layer only; 08 awaits
`exportCsv` and counts rows itself.
Charter basis: §Destination (no freezing — chunked driver is the canonical
path; interleaving test is its only mechanical check); §Done-when 1+5 (testable
src/export seam; smoke through the real path); §Scope-In (chunked/async, busy,
inline failure) and its silence on progress/cancel; §Glossary(in-progress
state); §Tech constraints (Blob/anchor download, no new deps); §Silence-defaults
(2) smallest reversible (3) no new dependency; §Priorities 1>2>3>4.
Objections considered (red-team round, all five conceded → amendments above):
(1) sync builder as attractive nuisance → rename + ban + grep guard;
(2) type-only imports unenforceable by no-touch tsconfig → the load probe;
(3) invisible-BOM test literals + double-BOM hazard → CSV_BOM constant,
single-writer rule, escape-only convention; (4) yield unproven by any gate →
mandatory interleaving test; (5) snapshot semantics unrecorded → contract
line 6. Runner-up B (async generator) rejected: for-awaited generators run as
microtask chains — the interleaving test is required under B too, with yield
discipline duplicated across consumers; 06/08 still materialize the full
string; B stays additively reachable beneath exportCsv if streaming becomes
real.
Rollback: undoing the shape = mechanical edits at import/call sites in three
files (06 tests, 07 trigger, scripts/smoke-export.mjs); bytes stay pinned by
D-0001..0006 independent of shape. Growth is additive (opts fields; a
csvChunks generator beneath exportCsv). The direction NOT to take: D
(UI-owned loop) — forfeits the smoke's real-path guarantee.
Supersedes: —

D-0008 | 2026-07-29 | #04 | exportCsv chunk size: opts.chunkSize (rows/chunk), default 500 via non-exported constant | Type 2; #02/#03 evidence: 250–1000 all byte-identical, 500 = 2.8ms max slice; §Silence-defaults(2) — retuning is one internal line, cannot change output bytes
D-0009 | 2026-07-29 | #04 | Yield between chunks: macrotask-class (timer-equivalent), v1 = await new Promise(r => setTimeout(r, 0)), private to exportCsv | Type 2; #02 §4 (microtasks don't yield rendering; setTimeout portable browser+Node); swappable only while D-0007 contract line 5's interleaving test stays green
D-0010 | 2026-07-29 | #04 | Smoke loader hook: ~14-line module.register() resolve hook lives ONLY in scripts/smoke-export.mjs, registered before any src import | Type 2; #03: engine loads hook-free, pre-registration required (failed pre-hook import poisons module cache); confined to the one ticket-08 file
D-0011 | 2026-07-29 | #04 | Export UI state home: App.tsx useState mirroring the refreshing/onRefresh precedent — App owns status ('idle'|'exporting'|'error'), captures rows/columns from its useMemo view at click, calls exportCsv, passes onExport+status props into Toolbar's Button (busy while exporting); no new store, no new file | Type 2; §Silence-defaults(1) convention-first (refreshing precedent; createStore is for cross-component state), (Persistence: transient, prefs frozen), (2) smallest reversible; Priority 1 additive-props-only; D-0007 line 6
D-0012 | 2026-07-29 | #04 | Export control failure surface: three states idle/exporting/error — exporting = existing Button busy (aria-busy+Spinner); error = terse sentence-case string (exact copy = build-time Type 2) in an adjacent element with role="status" aria-live="polite"; error clears only on retrigger (no timers, no auto-dismiss, no accessible-name churn) | Type 2; §Scope-In(inline, control's own state) + §Scope-Out(no toasts) kill (b) timers; §Silence-defaults(Copy/aria precedents) kill (c) label churn; §Glossary(in-progress state); D-0007 line 2 supplies exactly these three observable conditions
D-0013 | 2026-07-29 | SPEC | Trigger label: "Export" (bare verb) | Type 2; §Glossary(export = CSV download) + §Silence-defaults(Copy: terse; nearest pattern = single-verb "Refresh") + D-0011 sibling precedent; §Scope-Out(CSV-only) makes it unambiguous
D-0014 | 2026-07-29 | SPEC | Placement: toolbar row 2, after Refresh; role="status" error element adjacent at row end; row 1 stays filters-only | Type 2; D-0011 (refreshing precedent sibling), §Silence-defaults(1)+(2)+(Visual: toolbar rhythm), Priority 1 least-disturbance
D-0015 | 2026-07-29 | SPEC | Button variant: ghost (component default; Refresh stays the sole primary) | Type 2; §Silence-defaults(1) convention + (2) zero-prop diff; D-0012 decouples busy indication from variant
D-0016 | 2026-07-29 | SPEC | Error copy: fixed "Export failed" (no instruction, no runtime error text), cleared on retrigger | Type 2; D-0012 build-time-string rule excludes runtime text; nearest precedent "No sessions match the current filters." (bare declarative) excludes call-to-action
