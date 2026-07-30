# Spec — xlsx-export

Synthesized at SPEC (session s04, 2026-07-30) from the closed map, `CHARTER.md`,
`decisions.md` (empty — every fork pre-pinned by the human), and the verified
research note `notes/xlsx-structure.md`. No interview: the Decider answered the
one open shape (inline strings vs sharedStrings) from research + charter.

**Scope freezes at this gate.** Anything discovered after this line goes to
`icebox.md`, never into the plan. Every requirement below traces to a charter
section or the research note; the traceability table is at the end.

---

## Problem

The results table can export the current view as CSV (shipped, arc `csv-export`).
Spreadsheet users still get "convert text to number" prompts on the distance
column, and CSV carries no cell typing. The user wants the **same current view**
— rows matching active filters, in current sort order, restricted to visible
columns — exported as a native `.xlsx` workbook that opens cleanly in Excel,
Google Sheets, and Numbers, with `distanceKm` as a real number so it sorts and
sums natively. XLSX is an **additional** export beside CSV; nothing existing
changes except relabeling the current export button.

## Solution

A self-contained, dependency-free xlsx pipeline in `src/export/`, layered so each
layer is a test seam:

1. **ZIP container** (`src/export/zip.ts`) — `zipStore(entries)` packs
   already-serialized named byte parts into a valid `.zip` using
   **stored/uncompressed** entries (compression method 0), with a hand-rolled
   CRC-32 (poly `0xEDB88320`). Pure `Uint8Array` → `Uint8Array`. No compression,
   no `CompressionStream`, no dependency.
2. **Workbook model + OOXML serializer** (`src/export/xlsx.ts` +
   `src/export/xlsx-workbook.ts`) — `buildWorkbook(rows, columns)` produces an
   in-memory typed-cell model (the test oracle); `serializeXlsx(rows, columns)`
   renders the minimal five-part OOXML set (per the research note) and packs it
   via `zipStore` into the final `Uint8Array`.
3. **Async chunked entry point** (`src/export/xlsx.ts`) —
   `exportXlsx(rows, columns, opts?)` mirrors the shipped `exportCsv`: snapshots
   both array args at call time, processes rows in 500-row chunks yielding to the
   macrotask queue between them, returns the finished bytes.
4. **UI trigger** (`App` + `Toolbar`) — a second **"Export XLSX"** button beside
   the existing control, which is relabeled **"Export CSV"**; downloads
   `tracklist.xlsx` with the spreadsheetml MIME via the existing
   object-URL/anchor/revoke pattern; reuses the existing busy/error status.
5. **Real-path smoke + CI wiring** (`scripts/smoke-export-xlsx.mjs`, `package.json`,
   `ci.yml`, `README.md`) — exports the full 10,000-row fixture set through the
   real serializer and structurally validates the workbook.

The **cell-typing contract** (charter §Destination, §Scope-In, §Silence-defaults),
applied to the visible columns of the current view:

| column | header label | cell kind | cell value |
| --- | --- | --- | --- |
| `distanceKm` | `Distance (km)` (rewritten from `Distance`) | **number** | raw `row.distanceKm` (e.g. `10.4`), serialized invariant via `String(n)` |
| `date` | `Date` | string | `col.format(row)` → `2025-11-30` |
| `routeName` | `Route` | string | `col.format(row)` → the route text |
| `durationSec` | `Duration` | string | `col.format(row)` → `1:15:15` |
| `paceSecPerKm` | `Pace` | string | `col.format(row)` → `5:31 /km` |
| `effort` | `Effort` | string | `col.format(row)` → the effort text |

**Load-bearing subtlety (explicit to stop a plausible bug):** `durationSec` and
`paceSecPerKm` carry `numeric: true` in `COLUMNS`, but the charter types them as
**string** cells. Cell kind is therefore decided by `key === 'distanceKm'`,
**never** by `ColumnDef.numeric`. Only `distanceKm` is a number cell, and only its
header label is rewritten; all other headers use `col.label` verbatim. A column
the charter doesn't name (none in v1's set beyond these six) would default to a
string cell (charter §Silence-defaults).

## User stories

- **Export the current view as xlsx.** As a table user, I click "Export XLSX" and
  get `tracklist.xlsx` containing exactly the rows matching my active filters, in
  my current sort order, restricted to my visible columns — identical view
  semantics to the CSV export, paging ignored. *(charter §Destination, §Scope-In)*
- **Distance is a real number.** `distanceKm` opens as a numeric cell (`10.4`)
  with its unit in the header (`Distance (km)`), so it sorts and sums natively
  with no "convert text to number" prompt. *(charter §Destination, §Scope-In,
  §Silence-defaults)*
- **Everything else is the text I see.** `date`, `route`, `duration`, `pace`,
  `effort` are string cells holding the exact formatted text the table displays.
  *(charter §Destination, §Scope-In)*
- **Opens everywhere, no styling.** One sheet (`Sheet1`), one plain header row, no
  other styling; opens in Excel, Sheets, Numbers. *(charter §Destination,
  §Scope-In, §Silence-defaults; research note §0–§3 empirically verified openable)*
- **No UI freeze at scale.** Exporting 10,000 rows keeps the UI responsive.
  *(charter §Scope-In async chunked)*
- **CSV and the table are untouched.** The CSV export and every table behavior
  (sort/filter/page/column-pick/prefs) are unchanged; the only edit to the shipped
  control is its relabel to "Export CSV". *(charter §Priorities 1, §Scope-Out)*
- **Gated green in CI.** A real-path smoke exports all 10,000 rows through the xlsx
  code path and validates the workbook structurally; it runs in CI on every PR.
  *(charter §Done-when 5, §Merge&CI)*

## Seams (the boundaries tests observe behavior through)

New seams, kept at the highest points and as few as the layering allows; no
existing seam is changed.

- **`zipStore(entries: readonly ZipEntry[]): Uint8Array`** in `src/export/zip.ts`,
  where `ZipEntry = { name: string; bytes: Uint8Array }`. CRC-32 is exercised
  through `zipStore`'s output (or a co-located exported `crc32` helper) against
  known vectors. *(ticket #02)*
- **`buildWorkbook(rows, columns): Workbook`** in `src/export/xlsx.ts` — the
  in-memory typed-cell model, the **primary oracle**: tests assert per-column cell
  *kind* and *value* on it directly (no xlsx parser — dependency freeze). *(#03)*
- **`serializeXlsx(rows, columns): Uint8Array`** in `src/export/xlsx.ts` — tests
  scan the bytes for the ZIP magic and expected part names (structural, no parser).
  *(#03)*
- **`exportXlsx(rows, columns, opts?): Promise<Uint8Array>`** in `src/export/xlsx.ts`
  — tests assert the arg-snapshot guarantee and async-equals-sync equivalence. *(#04)*
- **`Toolbar` export-control props + `App` export orchestration** — observed via
  React Testing Library: clicking a button invokes the right path and triggers the
  right download; busy/error render on the right control. *(#05)*
- **`scripts/smoke-export-xlsx.mjs` stdout** — success is the exact line
  `xlsx:ok rows=10000` and exit 0. *(#06)*

## Implementation decisions

No ledger entries exist yet (the charter pre-pinned every fork). Two Type-2 calls
are **deferred to BUILD**, to be logged as `D-####` entries in their ticket Work
logs when made:

- **Inline strings over `sharedStrings` (at #03).** String cells use
  `t="inlineStr"` with `<is><t>…</t></is>`, not a shared string table. Rationale
  (research note §3): simplest, self-contained per cell, statelessly serializable
  in the chunked path; the only cost (larger uncompressed size on repeated
  strings) is irrelevant for a STORED client download. Smallest reversible option
  (charter §Silence-defaults); `sharedStrings` remains the reversible upgrade if a
  future arc adds compression. *Type 2 — log D-#### at #03.*
- **Export-status shape (at #05).** Whether the two exports share one
  `exportStatus` field or get per-format fields is a Type-2 (charter
  §Silence-defaults: "follow the current single-`exportStatus` shape, smallest
  reversible"). The resolution **must preserve Priority 1 (zero regressions to the
  CSV control's behavior)**: whichever shape is chosen, an in-flight XLSX export
  must not change the CSV button's observable behavior beyond its relabel, and
  vice-versa. The Decider resolves against the charter at #05 and logs the D-####.

Fixed by the charter/research (not open): minimal five-part OOXML set, no
`styles.xml`/`sharedStrings.xml`; stored ZIP method 0; hand-rolled CRC-32
`0xEDB88320`; sheet name `Sheet1`; filename `tracklist.xlsx`; MIME
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; fixed MS-DOS
timestamp for deterministic output; all XML string content escaped.

## Testing decisions

- **Oracle without a parser (dependency freeze).** The in-memory `Workbook` model
  is the oracle for cell *kind* and *value* — assert on `buildWorkbook` output
  directly. `serializeXlsx` output is validated **structurally** by scanning bytes
  (ZIP magic `50 4B 03 04`; presence of `[Content_Types].xml` and
  `xl/worksheets/sheet1.xml`; row count = occurrences of `<row ` minus the header).
  Expected values come from independent sources (known-good literals, the research
  note's worked example, `format()` output computed from fixtures) — never
  recomputed the way the code computes them (no tautologies).
- **CRC-32 known vectors:** `crc32("") = 0x00000000`, `crc32("123456789") =
  0xCBF43926` (research note §5). ZIP structure asserted against the byte layout
  in research note §4.
- **Tests only at the seams above; behavior, not internals.**
- **Ratchets (monotonic, charter §Quality invariants):** total tests **≥ 90**
  (baseline 80), xfail/skip stay **0**; `src/export/xlsx` carries **≥ 10** tests;
  `du -sk dist/` after build **≤ 240** (baseline 216).

## Acceptance criteria (executable — every requirement)

Global gate (charter §Done-when 1, 3, 4; §Quality invariants):
- `npm test` → exit 0, all green, total tests **≥ 90** (baseline 80, 0 skip/xfail)
- `npm run typecheck` → exit 0
- `npm run build` → exit 0, then `du -sk dist/` → **≤ 240**

Per requirement:

- **R1 — ZIP writer** *(#02)*: `npx vitest run src/export/zip` → exit 0, **≥ 5**
  assertions: CRC-32 matches the known vectors; local + central headers well-formed
  and their shared fields (method, CRC, sizes, name) match; EOCD present with
  correct entry count; output's first 4 bytes are `50 4B 03 04`; one central-
  directory entry per input.
- **R2 + R3 — workbook model + serializer** *(#03; charter §Done-when 2)*:
  `npx vitest run src/export/xlsx` → exit 0, **≥ 10** tests asserting, on the model:
  `distanceKm` is a **number** cell holding `10.4` (raw, not `"10.40 km"`);
  `date`/`routeName`/`durationSec`/`paceSecPerKm`/`effort` are **string** cells
  holding `col.format(row)` (including `durationSec`/`paceSecPerKm` as strings
  **despite** `numeric: true`); the header row includes `Distance (km)` and the
  other labels verbatim. And on the bytes: `serializeXlsx` output carries the ZIP
  magic + `[Content_Types].xml` + `xl/worksheets/sheet1.xml`.
  Plus `npm test` → exit 0, total > 80 (ratchet holds as tests are added).
- **R4 — async chunked export** *(#04)*: within `npx vitest run src/export/xlsx` →
  a test proves the arg-snapshot guarantee (mutating an input array after the call
  does not change the output) and that the async `exportXlsx` result equals the
  synchronous `serializeXlsx` output for the same input.
- **R5 — UI trigger** *(#05; charter §Priorities 1)*:
  `npx vitest run src/App.export src/components/Toolbar` → exit 0 — clicking
  "Export XLSX" invokes the xlsx path and triggers a `tracklist.xlsx` download with
  the spreadsheetml MIME; "Export CSV" still triggers the unchanged `tracklist.csv`
  download; busy/error assert on the correct control. Plus `npm test` → exit 0, all
  existing table/CSV tests unchanged; `npm run typecheck` → exit 0.
- **R6 — smoke + CI wiring** *(#06; charter §Done-when 5, §Merge&CI)*:
  `node scripts/smoke-export-xlsx.mjs` → prints `xlsx:ok rows=10000`, exit 0;
  `npm run test:smoke:xlsx` → same; `grep -c "test:smoke:xlsx"
  .github/workflows/ci.yml` → ≥ 1; `grep -c "test:smoke:xlsx" README.md` → ≥ 1;
  `git diff --name-only origin/main -- .github/workflows/ci.yml` shows only the one
  appended step differs.

## Out of scope (charter §Scope-Out, verbatim intent, + everything iceboxed)

- Styling of any kind: bold/frozen header, column widths, colors/borders,
  auto-filter, freeze panes.
- Excel number-formats and native time/date serials — `duration`/`pace`/`date`
  stay formatted strings.
- DEFLATE/compressed ZIP entries — stored/uncompressed only.
- Extra sheet content: totals/summary rows, multiple sheets, formulas.
- Format-picker or export-settings UI (filename, sheet-name, delimiter choosers).
- Any export beyond the current view; xlsx from any source other than the results
  table.
- PDF, ODS, TSV, or any format beyond the existing CSV and this arc's XLSX.
- Any server-side/backend component; the app stays client-only.
- Replacing/removing the CSV export; any change to CSV behavior beyond the button
  relabel; any change to existing table behavior.
- Toast/notification system; copy-to-clipboard variant; keyboard shortcuts.
- Refactoring existing modules beyond the minimal shared export seam.
- New dependencies of any kind (runtime or dev); versions stay pinned; a new
  runtime dependency requires a Type 1 ADR.
- Telemetry/analytics; i18n beyond en-US; lint/format/git-hook tooling.
- README/docs expansion beyond, at most, one line documenting the xlsx smoke.
- **Iceboxed (deferred, not this arc):** the `ExportStatus` inline-union hoist to a
  single named type across App + Toolbar; prior-arc repo-hygiene findings
  (check-script aggregation, `engines` floor, CI push filter, smoke robustness) in
  `docs/auto/archive/smoke-gate/icebox.md`.

## Traceability

Every requirement → charter/research source. Nothing untraceable survives this
gate.

| Req | Source | Ticket |
| --- | --- | --- |
| R1 ZIP writer + CRC-32 | §Scope-In (dep-free ZIP), §Silence-defaults (stored/CRC32), §Tech constraints; research §4–§5 | #02 |
| R2 workbook model + cell-typing | §Destination, §Scope-In (cell typing), §Silence-defaults (cell typing); research §0, §3 | #03 |
| R3 OOXML serializer (5-part, escaped, packed) | §Scope-In (serializer), §Silence-defaults (minimal parts, inline strings); research §1–§3, §6 | #03 |
| R4 async chunked exportXlsx | §Scope-In (async chunked, no freeze at 10k), §Silence-defaults (follow exportCsv) | #04 |
| R5 UI: Export XLSX + relabel + download | §Scope-In (UI trigger), §Silence-defaults (download/status/labels/aria), §Priorities 1 | #05 |
| R6 smoke + CI + npm + README | §Done-when 5, §Scope-In (smoke script), §Merge&CI | #06 |

## Red-team pass

Ran before the gate (fresh-context subagent + orchestrator answers). "What would
the charter's author hate? What is silently assumed? What traces to nothing?"

1. **`numeric: true` on duration/pace could mislead a worker into number cells.**
   → Answered: called out explicitly (§Solution load-bearing subtlety + R2/R3
   acceptance) — cell kind keys off `key === 'distanceKm'`, never `col.numeric`; an
   acceptance test asserts duration/pace are string cells.
2. **A shared `exportStatus` could make the CSV button flash busy during an XLSX
   export — a regression to the shipped control (Priority 1).** → Answered: the
   §Implementation-decisions status-shape Type-2 is constrained to preserve
   zero-regression; R5 acceptance requires the CSV control unchanged beyond relabel.
   Left to the Decider at #05, not silently frozen either way.
3. **Number-cell value could wrongly serialize the display string `"10.40 km"` or a
   locale-formatted number.** → Answered: R2/R3 fix the value to raw
   `row.distanceKm` via invariant `String(n)`; acceptance asserts `10.4`, not
   `"10.40 km"`.
4. **"Opens in Excel/Sheets/Numbers" is not unit-testable (no parser, dependency
   freeze).** → Answered: honestly acknowledged. The claim is de-risked by research
   §0 (a minimal five-part STORED workbook was built in-container and opened by
   openpyxl reading `A2=10.4` float + a string cell); tests assert structure, the
   smoke asserts the real 10k-row path structurally. Living-app open in a real
   spreadsheet app is outside automated scope — the strongest available evidence is
   the empirical research open, recorded as such.
5. **XML-escaping / special characters in route names could corrupt the sheet.** →
   Answered: §Implementation-decisions requires all string content XML-escaped
   (research §2); worker tests at #03 should include a value with `&`/`<`.
6. **CSV smoke counts CRLF records; the xlsx smoke has no line delimiter.** →
   Answered: R6/#06 count is `<row ` occurrences minus the header (research §6),
   not lines; structural validation only, no parser.
7. **Does any requirement trace to nothing?** → No: the traceability table maps
   every R to a charter section (and research where empirical). No orphan stories.

No requirement was cut; two objections tightened the spec text (items 1, 3). Scope
is frozen as of this gate.
