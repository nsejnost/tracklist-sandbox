# Icebox — csv-export (append-only)

- 2026-07-29 | MAP | XLSX export — charter §Scope-Out names it a candidate
  next arc; nothing in this arc builds toward it beyond the CSV seam existing.
- 2026-07-29 | FINISH arch checkpoint | scripts/smoke-export.mjs (R9) is not
  wired into any automated gate — no package.json script, no CI step; only
  invoked manually. Deletion test: removing it today breaks nothing, so it
  isn't earning its keep as-delivered even though its logic is sound and
  does catch full-scale (10k-row) real-path regressions the mocked/small-
  fixture tests can't reach. Triaged Deferred, not Blocking: charter
  Done-when 5 only requires the command to exist and print
  `csv:ok rows=10000` (met, verified against main), and wiring it into CI
  means editing `.github/workflows/ci.yml`, an explicit charter no-touch
  zone — out of this arc's lawful reach. Candidate for the next charter: add
  `npm run test:smoke` + a CI step, as a deliberate decision, not a silent
  scope expansion. (Strong recommendation strength from the checkpoint
  agent.)
- 2026-07-29 | FINISH arch checkpoint | `'idle' | 'exporting' | 'error'`
  export-status union is written inline in both App.tsx and Toolbar.tsx
  instead of a single named type, deviating from this repo's own
  string-union convention (codingstandards.md: EFFORTS/DENSITIES/PAGE_SIZES
  pattern). TypeScript structural typing means drift would fail to compile,
  not silently break, so risk is low. Triaged Deferred: checkpoint rated it
  "Worth exploring," not "Strong" — below the bar for a bounded-refactor
  ticket at this checkpoint. Candidate for the next arc's hygiene pass:
  hoist to `export type ExportStatus = ...` in Toolbar.tsx (already owns
  ToolbarProps) and import into App.tsx.
- 2026-07-29 | FINISH arch checkpoint | `buildCsvSync`'s "test-oracle only,
  do not import outside src/export/" rule is enforced by JSDoc comment only
  — no lint tooling exists anywhere in this repo to make it structural.
  Checkpoint agent explicitly did not recommend action (matches the
  project's existing total absence of lint tooling; not a regression this
  arc introduced). Noted for completeness only.
