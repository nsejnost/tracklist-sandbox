# 05 — UI: second "Export XLSX" button beside relabeled "Export CSV"
type: build
status: open
blocked_by: 04
charter_refs: §Scope-In(second Export XLSX button beside relabeled Export CSV; reuse busy/error status), §Silence-defaults(download tracklist.xlsx + MIME; Sheet1; shared busy/error pattern, one-field-vs-per-format = Type-2; terse labels; aria as precedented), §Priorities 1 (zero regressions to the shipped CSV export/table)
seams: `Toolbar` props (export controls); `App` export orchestration (`handleExport*` + status state)
touches: src/App.tsx, src/components/Toolbar.tsx, src/App.export.test.tsx, src/components/Toolbar.test.tsx, src/styles.css (only if a second button needs it)
attempts: 0/3
split_generation: 0

## What to build
Wire the async `exportXlsx` (#04) to a new download trigger, matching the shipped CSV UX exactly:
- In `Toolbar`: a second button **"Export XLSX"** beside the existing export button, which is relabeled **"Export CSV"** (the only change to the shipped control). Both reuse the existing busy (`aria-busy`) + inline error (`role="status"`, `aria-live="polite"`) pattern.
- In `App`: an `handleExportXlsx` mirroring `handleExport` — call `exportXlsx(sorted, columns)`, wrap the returned bytes in a `Blob` (MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`), download as **`tracklist.xlsx`** via the existing object-URL/anchor/revoke pattern; on failure surface the error state.
- Export status shape (one shared field vs per-format) is a charter **Type-2** call — resolve to the smallest reversible option that follows the current single-`exportStatus` precedent; log the D-entry in this Work log.
- No change to any existing table behavior (sort/filter/page/column-pick/prefs) — zero-regression is Priority 1.

## Acceptance (provisional — finalized at TICKETS from spec.md)
- run: `npx vitest run src/App.export src/components/Toolbar`   expect: exit 0 — clicking "Export XLSX" invokes the xlsx path and triggers a `tracklist.xlsx` download with the xlsx MIME; "Export CSV" still triggers the unchanged csv download; busy/error states assert on the right control.
- run: `npm test`   expect: exit 0, all green (existing table/CSV tests unchanged)
- run: `npm run typecheck`   expect: exit 0

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #04. Touches App + Toolbar (~2 modules) — at the sizing edge; keep the diff tight or split at TICKETS.
