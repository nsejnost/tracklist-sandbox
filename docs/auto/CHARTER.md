# CHARTER — xlsx-export

STATUS: TEMPLATE — the charter interview removes this line; validation refuses to run while it is present.

<!-- Authored by a human through the /autopilot charter interview on 2026-07-30
     (Renewal; prior arcs csv-export and smoke-gate archived under
     docs/auto/archive/). Read-only in run mode; amended only through the
     interview (Repair / Renewal). Every section is load-bearing: the Decider
     answers runtime questions from this document. -->

## Destination
This arc succeeds if someone using the results table can take exactly what they're
currently looking at — the rows matching their active filters, in their current
sort order, restricted to their visible columns — out of the app as a native
`.xlsx` workbook that opens in Excel, Google Sheets, and Numbers with no "convert
text to number" prompts. The `distanceKm` column exports as a real number, with
its unit carried in the header (`Distance (km)`), so it sorts and sums natively in
the spreadsheet; `duration` (`1:15:15`), `pace` (`5:31 /km`), `date`
(`2025-11-30`), `route`, and `effort` export as the exact formatted text the table
displays. The workbook is a single sheet with one plain header row and no other
styling. XLSX is an **additional** export alongside the existing CSV — the CSV
export and every existing table behavior (sorting, filtering, paging,
column-picking, preferences) are unchanged.

## Done-when (mechanically checkable — this defines termination)
- [ ] `npm test` → exit 0, all green, total tests ≥ 90 (baseline 80, 0 skip/xfail)
- [ ] `npx vitest run src/export/xlsx` → exit 0, ≥ 10 tests, asserting per-column
      cell types on the in-memory workbook model: `distanceKm` is a number cell
      (`10.4`), and `date`/`routeName`/`durationSec`/`paceSecPerKm`/`effort` are
      string cells holding the table's formatted text; header row present
      (`Distance (km)`). (Verified 2026-07-30: exits 1 "No test files found"
      while absent — determinate; defines termination, not entry.)
- [ ] `npm run typecheck` → exit 0
- [ ] `npm run build` → exit 0, then `du -sk dist/` → ≤ 240 (baseline 216)
- [ ] `node scripts/smoke-export-xlsx.mjs` → prints `xlsx:ok rows=10000` (exports
      the full 10,000-row seeded fixture set through the real xlsx code path and
      structurally validates the workbook: ZIP magic bytes, `[Content_Types].xml`
      + `xl/worksheets/sheet1.xml` present, 10,000 data rows). (Verified
      2026-07-30: exits 1 "Cannot find module" while absent — determinate; script
      created by the arc.)

All five executed at interview time (2026-07-30): each runs and yields a
determinate result; the last two are unmet-because-absent today, as expected —
they define termination, not entry.

## Priorities (strict ranking — the Decider's tiebreaker for Type 2 decisions)
1. Zero regressions — the shipped CSV export, the results table, and CI's existing
   judgments stay intact (mergeability)
2. Faithfulness to existing conventions (the export seam, component/store
   patterns, workflow + README style)
3. Feature completeness (xlsx export wired, typed, documented, gated green)
4. Polish

## Scope
**In (v1 — the confirmed smallest success):**
- Native `.xlsx` export of the **current view**: rows matching the active filters,
  in the current sort order, restricted to the currently visible columns; paging
  ignored — identical view semantics to the existing CSV export.
- Cell typing per the confirmed contract: `distanceKm` → a **number** cell
  (`10.4`) with its unit in the header (`Distance (km)`); `date`, `routeName`,
  `durationSec` (`1:15:15`), `paceSecPerKm` (`5:31 /km`), `effort` → **string**
  cells holding the table's formatted text. Single sheet, one plain header row, no
  other styling.
- An export module in `src/export/` exposing a synchronous test-oracle builder
  plus an async chunked `exportXlsx` mirroring `exportCsv` (snapshots its array
  args at call time; yields between chunks; no UI freeze at 10k rows).
- A dependency-free ZIP + OOXML serializer producing a valid minimal workbook
  using **stored/uncompressed** ZIP entries.
- UI trigger: a second **"Export XLSX"** button beside the existing control
  (relabeled **"Export CSV"**), reusing the existing busy + inline error status
  pattern.
- `scripts/smoke-export-xlsx.mjs`: exports the full 10,000-row seeded fixture set
  through the real xlsx path and structurally validates the workbook. (CI /
  README / npm-script wiring of this smoke is settled in Merge & CI.)

**Out (explicit — an eager agent adds none of these):**
- Styling of any kind: bold/frozen header, column widths, colors/borders,
  auto-filter, freeze panes.
- Excel number-formats and native time/date serials — `duration`/`pace`/`date`
  stay formatted strings.
- DEFLATE/compressed ZIP entries — stored/uncompressed only.
- Extra sheet content: totals/summary rows, multiple sheets, formulas.
- Format-picker or export-settings UI (filename, sheet-name, delimiter choosers).
- Any export beyond the current view (all columns regardless of visibility;
  ignoring filters/sort); xlsx from any source other than the results table.
- PDF, ODS, TSV, or any format beyond the existing CSV and this arc's XLSX.
- Any server-side/backend component; the app stays client-only.
- Replacing or removing the CSV export; any change to CSV behavior beyond the
  button relabel; any change to existing table behavior (sorting, filtering,
  paging, column-picking, preferences).
- Toast/notification system; copy-to-clipboard variant; keyboard shortcuts.
- Refactoring existing modules beyond the minimal shared export seam; the
  `ExportStatus` inline-union hoist and other architecture findings go to
  checkpoint/icebox, never into feature tickets.
- New dependencies of any kind, runtime or dev (a ZIP or xlsx library); versions
  stay pinned; a new runtime dependency requires a Type 1 ADR.
- Telemetry/analytics; i18n beyond existing en-US; lint/format/git-hook tooling.
- README/docs expansion beyond, at most, one line documenting the xlsx smoke in
  the existing Commands section (see Merge & CI).

## No-touch zones
- `src/export/csv.ts` — the shipped CSV export module; xlsx is self-contained,
  imports nothing from it.
- `src/types.ts`, `src/utils/columns.ts` — the `RunSession`/`ColumnDef` model and
  `COLUMNS` table; read-only, xlsx cell-typing lives in the export module.
- `src/data/fixtures.ts` — deterministic seeded fixtures; tests assert exact
  values. Import freely, never modify. (carried from csv-export)
- `src/test/setup.ts` — shared vitest setup; add test files, never the harness.
  (carried)
- `vite.config.ts`, `tsconfig.json`, `index.html` — build and TS config. (carried)
- `package-lock.json` — the dependency freeze, self-enforcing. (carried from
  smoke-gate)
- `scripts/smoke-export.mjs`, `scripts/resolve-ts-hook.mjs` — the existing csv
  smoke + TS hook; the arc adds a new xlsx smoke script beside them, never edits
  these.
- `.github/workflows/ci.yml` — no-touch **except** appending the single
  `- run: npm run test:smoke:xlsx` step after the existing smoke step; no other
  change to the workflow.
- `docs/auto/archive/**` — previous arcs' history; a live run never touches it.
  (carried)
- Note: `src/utils/format.ts` and all other existing `src/**` are touchable but
  **behavior-frozen** by Scope-Out ("no change to existing table/CSV behavior") +
  the test ratchet — not listed as hard no-touch.

## Silence-defaults (what the Decider does when this charter is quiet)
Default of defaults, applied in order: (1) follow the existing codebase
convention; (2) pick the smallest reversible option; (3) prefer no new dependency;
(4) still tied → defer to Priorities. Arc-specific rules:
- **Cell typing:** any column the charter doesn't explicitly type → a string cell
  holding the table's formatted text (`ColumnDef.format(row)`). Only `distanceKm`
  is a number cell, using the **raw** `row.distanceKm` value (not the 2-decimal
  display), with its unit in the header label `Distance (km)`.
- **ZIP packaging:** stored/uncompressed entries only (compression method 0);
  never compress. CRC32 hand-rolled; no `CompressionStream`.
- **OOXML parts:** the minimal valid set only; no `styles.xml`/theme/optional
  parts unless strictly required for a file Excel/Sheets/Numbers open cleanly.
  Inline strings vs a `sharedStrings` part is a Type 2 implementation choice
  (smallest reversible).
- **Download:** filename `tracklist.xlsx` (mirrors `tracklist.csv`); Blob MIME
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; reuse App's
  existing object-URL/anchor/revoke pattern. Sheet name `Sheet1`.
- **Status/UI:** the two exports reuse the existing busy/error pattern; one-shared-
  field vs per-format status is Type 2 (follow the current single-`exportStatus`
  shape, smallest reversible). Button labels terse sentence case (`Export CSV`,
  `Export XLSX`) matching existing strings; aria as precedented (`aria-busy`,
  `role="status"`, `aria-live="polite"`).

## Stall policy
- Ticket blocked after max attempts: leave-blocked (→ halt with the blocker
  named) — a partial xlsx export can't satisfy Done-when, so descoping would halt
  anyway; leave-blocked is the honest form
- Unresolvable decision conflict: halt
- Done-when unmet after replan budget: halt
- CI red that reproduces on main (pre-existing): note-and-continue

## Budgets
- max_sessions: 30
- max_parallel: 2
- max_attempts_per_ticket: 3
- max_review_cycles: 2
- max_griller_questions: 7
- replans: 1
- ci_wait_minutes: 15
- arch_checkpoint_every: 5
- max_session_minutes: 90
- max_hours: 24
- pause_after_spec: false
- mutation_check: false

## Merge & CI policy
- target_branch: main
- delivery: per-ticket PRs, squash-merged automatically on green; no human review
  gate
- required repo settings (verified at preflight): squash merge enabled; no
  required human reviews on main; auto-merge enabled if branch protection requires
  status checks
- ci: `.github/workflows/ci.yml` (npm ci → `npm test` → `npm run typecheck` →
  `npm run build` → `npm run test:smoke` → the arc's appended
  `npm run test:smoke:xlsx`; Node 22) must pass on every PR, including the arc's
  own ticket PRs once the xlsx step merges
- pause_after_spec: false — this is the human's third arc; the spec-review
  calibration ritual (on for csv-export) is retired

## Quality invariants (ratchets — monotonic for the whole run)
- CI green on every merge — commands, verbatim: `npm test`, `npm run typecheck`,
  `npm run build`, `npm run test:smoke`, `npm run test:smoke:xlsx`
- Test count never decreases; xfail/skip never increases (consolidation requires
  an Auditor-countersigned D-entry)
- Baselines at charter time (recon, 2026-07-30): tests=80 xfail=0 skip=0 across 13
  files
- Bundle ratchet: `npm run build` then `du -sk dist/` → ≤ 240 (baseline 216;
  headroom for the hand-rolled ZIP+OOXML writer)

## Tech constraints
- TypeScript strict as configured; `tsconfig.json` is no-touch
- React function components only; the vanilla-zustand `createXxxStore`/
  `useXxxStore` pattern; plain CSS in `src/styles.css` only
- Versions pinned as-is: React 19, Vite 8, vitest 4, zustand 5, TypeScript 7,
  Node 22 in CI — no upgrades, no new dependencies of any kind (runtime or dev); a
  new runtime dependency requires a Type 1 ADR and the bundle ratchet applies
  regardless
- The xlsx serializer uses only standard JS/Web APIs (`Uint8Array`, `TextEncoder`,
  hand-rolled CRC32); stored/uncompressed ZIP entries; file download via the
  existing Blob/object-URL/anchor pattern
- The xlsx smoke script runs under Node 22's TS type-stripping via the existing
  `scripts/resolve-ts-hook.mjs`, consistent with the csv smoke
- The CI step is a plain `- run:` line — no new third-party `uses:` actions enter
  the workflow

## Glossary
- **view** — rows matching the current filters, in the current sort order,
  restricted to the currently visible columns; independent of paging
- **workbook / sheet / cell** — the xlsx object model: one workbook, one worksheet
  (`Sheet1`), a grid of typed cells
- **typed parity** — the fidelity bar: `distanceKm` as a native number cell; every
  other column a string cell holding the table's formatted display text; one
  header row; no other styling
- **stored ZIP entry** — an uncompressed ZIP member (compression method 0); the
  arc's dependency-free packaging choice
- **OOXML** — Office Open XML SpreadsheetML; a `.xlsx` is a ZIP of XML parts
- **structural validation** — the smoke's dependency-free check: ZIP magic bytes +
  expected parts present + row count, without parsing cells through a library
- **the xlsx smoke** — `node scripts/smoke-export-xlsx.mjs`: the 10,000-row
  real-path xlsx check; success = prints `xlsx:ok rows=10000`
