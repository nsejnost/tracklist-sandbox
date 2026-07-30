# 05 — Build: toolbar search input + live narrowing of the visible rows
type: build
status: open
blocked_by: 04
charter_refs: §Destination (a search box in the toolbar; the table narrows live to fuzzy matches over the current filtered/sorted view; existing CSV/XLSX exports and every current table behavior unchanged; no freeze at 10,000 rows), §Scope-In (a search input in the toolbar; live narrowing of the visible rows), §Silence-defaults (empty query → full view; ties → existing sort order; case-insensitive over visible text columns), §Priorities 1 (zero regressions — export/table/CI intact) & 4 (polish), §No-touch (src/export/**; src/data/fixtures.ts; src/test/setup.ts; index.html; src/types.ts + src/utils/columns.ts), §Scope-Out (no match-span highlighting; no search history/persistence; no regex/advanced-query; styling beyond a plain input)
seams: src/components/Toolbar.tsx (a plain search input); src/stores/tableStore.ts (query state + a derived ranked/narrowed view over the current filters+sort+visible columns, via #04's engine); src/components/ResultsTable.tsx consumes the narrowed view
touches: src/components/Toolbar.tsx, src/stores/tableStore.ts, src/App.tsx (wiring), src/components/*.test.tsx + src/stores/*.test.ts (new/updated) — NOT src/export/**, NOT src/types.ts / src/utils/columns.ts
attempts: 0/3
split_generation: 0

## What to build
A **plain text search input in the toolbar**, wired through `tableStore` so that typing **live-narrows the visible rows** to fuzzy matches (via #04's engine) ranked best-match-first, computed over the **current** filtered + sorted + visible-column view (the Glossary "view"), without freezing at 10,000 rows. **Empty query restores the full view.** Ranking ties broken by the existing sort order. The existing **CSV/XLSX export and all current table behavior stay unchanged** (Priority 1 — zero regressions). Plain input only — no styling beyond a plain field, no highlight, no history/persistence (Scope-Out).

> Coarse MAP node. Acceptance is **finalized at TICKETS from the frozen spec.md**. Per the charter NOTE this arc is **not expected to reach BUILD** — the human stops after #03's ADR lands.

## Acceptance (PRELIMINARY — finalized at TICKETS from spec.md; charter Done-when 1,3,4 + Priority-1 regression guard)
- run: `npm test`   expect: exit 0, total ≥ 118 by arc end; existing export + table + CI test judgments all still green (zero regressions)
- run: `npx vitest run src/components/Toolbar src/stores/tableStore src/App`   expect: search narrows the view, empty-query restores the full view, ties fall back to the existing sort — each asserted
- run: `npm run typecheck`   expect: exit 0
- run: `npm run build` then `du -sk dist/`   expect: build exit 0, dist ≤ 260
- run: `npm run test:smoke` and `npm run test:smoke:xlsx`   expect: `csv:ok rows=10000` / `xlsx:ok rows=10000` (exports unregressed)

## Work log
- 2026-07-30T14:22Z s2 (MAP): node created. type=build. Blocked by #04 (needs the engine). Feature-flaggable if independence trips at TICKETS mergeability-skeptic. Refined at TICKETS from spec. Not expected to be reached (drill stops after #03).
