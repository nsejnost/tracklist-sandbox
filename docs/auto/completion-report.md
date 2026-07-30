# DONE — xlsx-export — 2026-07-30
Native `.xlsx` export of the current results-table view, alongside the existing CSV, built dependency-free (typed parity: `distanceKm` a real number, every other column the table's formatted string; single sheet, one header row, no styling; stored-ZIP + minimal OOXML).

## Shipped (slice → PR → main)
- #02 dependency-free stored-ZIP writer (`zipStore` + hand-rolled CRC-32) → PR #13 → main `d33f85f`
- #03 workbook model + OOXML serializer (`buildWorkbook` oracle, `serializeXlsx`) → PR #14 → main `804931d`
- #06 real-path xlsx smoke script + CI/npm/README wiring → PR #15 → main `4e3fb44`
- #04 async chunked `exportXlsx` (arg-snapshot, between-chunk yield) → PR #16 → main `f926f62`
- #05 UI: second "Export XLSX" button beside relabeled "Export CSV" (per-control status) → PR #17 → main `45f2f09`
- #01 minimal-xlsx-structure research (foreground) → `docs/auto/notes/xlsx-structure.md` (no PR — coordination-branch note)

## Done-when results (run verbatim against main HEAD 45f2f09, s10 2026-07-30)
- `npm test` → exit 0, **110 passed** (15 files, 0 skip/xfail) — ≥ 90 ✓ (baseline 80)
- `npx vitest run src/export/xlsx` → exit 0, **19 passed** — ≥ 10 cell-type tests ✓
- `npm run typecheck` → **exit 0** ✓
- `npm run build` → exit 0, then `du -sk dist/` → **220** — ≤ 240 ✓ (baseline 216; +4k for the xlsx engine)
- `node scripts/smoke-export-xlsx.mjs` → **`xlsx:ok rows=10000`** ✓
- (ratchet guard) `npm run test:smoke` → `csv:ok rows=10000` — shipped CSV export unregressed ✓

## Decisions: 4 (all Type 2; no Type 1 ADRs — every fork was charter-pinned or a two-way door)
- D-0001 (#03) inline strings over `sharedStrings` (smallest reversible; statelessly serializable in the chunked path)
- D-0002 (#04) `exportXlsx` mirrors `exportCsv`'s chunk/yield locally rather than importing the no-touch csv.ts; per-chunk build INSIDE the loop + shared `packWorkbook` so bytes stay identical (the hollow-yield version was rejected in review as not delivering "no freeze at 10k")
- D-0003 (#05) per-control `csvStatus`/`xlsxStatus` — rejected the single shared `exportStatus` as a Priority-1 trap (would flash the shipped CSV button busy during an xlsx export)
- D-0004 (arch checkpoint, wave 4) all 3 duplication findings → icebox, no bounded-refactor/blocking ticket (Priority-1: no pre-FINISH churn of shipped controls)

## Architecture findings for next arc: 6 in icebox
Wave-4: F1 duplicated download seam + twin handlers (Strong); F2 `ExportStatus` tri-state hoist (Worth exploring); F3 chunked-async driver duplicated csv↔xlsx (Speculative). End-of-arc: N1 intra-file sync/async twin in xlsx.ts (Worth exploring — lands in touchable code, less blocked than F3); N2 async tail runs sync after last yield, ~10-35ms at 10k (Speculative, non-blocking); plus latent hardening notes (escapeXml control chars, String(value) numerics, columnLetter >26 branch — shared with CSV, not regressions).

## Icebox: 7 total
1 charter carry (ExportStatus hoist, first noted at charter time) + 6 arch findings above. All candidates for a future hygiene arc's charter; none block this arc.

## Blocked / descoped: none
Every Scope-In item shipped; every Done-when met on main.

## Run stats
Sessions used: 10/30 · waves: 4 · attempts spent: 5 (one per build/task ticket, all merged on the first attempt; #04 took one in-attempt review fix round for the hollow-yield finding). Phase gates VALIDATE/MAP/SPEC/TICKETS all passed first try (0 failures). `pause_after_spec: false` (no review pause). Scheduling: Lane A; the self-bind chain degraded when the send_later MCP disconnected mid-run — the hourly babysitter floor + manual pokes carried the run through to completion (documented in session-log).

## Human cleanup (agent cannot do these)
- **Delete the hourly babysitter Routine** in the claude.ai Routines dashboard — it is UI-created and agent-unreachable; until removed it fires a harmless hourly see-DONE-and-exit session.
- Optionally delete the merged remote ticket branches (proxy-blocked from headless sessions): `auto/xlsx-export-t02`, `-t03`, `-t04`, `-t05`, `-t06`, and (this session) the `-archive` branch after its PR merges.
