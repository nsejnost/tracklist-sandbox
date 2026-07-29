# DONE — csv-export — 2026-07-29

Shipped:
- #01 codingstandards.md (task) → PR #3 (squash 9d21eef)
- #02 csv-interop research (research) → notes/csv-interop.md, merged with the map close (no PR — research artifact only)
- #03 chunked-export prototype (prototype) → notes/chunked-export-proto.md; scratch branch auto/csv-export-proto-03, never merged (by design)
- #04 export engine seam (decision) → D-0007 (ADR) + D-0008..0012, merged with the map close
- #05 CSV text policy (decision) → D-0001..0006, merged with the map close
- #06 export-core: buildCsvSync/exportCsv (build) → PR #4 (squash c9dfb03)
- #07 export UI trigger (build) → PR #6 (squash b6f5e5b)
- #08 smoke-export script + README line (build) → PR #5 (squash 5d1d5a6)

Done-when results (run against main @ b6f5e5b):
- `npx vitest run src/export/` → 12/12 tests passed, exit 0 (≥12 required)
- `npm test` → 80/80 tests passed, exit 0, 13 files, 0 skipped (≥75 required, baseline 63)
- `npm run typecheck` → exit 0, clean
- `npm run build` → exit 0; `du -sk dist/` → 216 (≤230 required, baseline 216 — zero bundle growth)
- `node scripts/smoke-export.mjs` → prints `csv:ok rows=10000`, exit 0

Decisions: 16 (D-0001..D-0016). Type 1 ADRs: D-0007 (export engine shape: sync
core `buildCsvSync` oracle + async chunked `exportCsv` driver, BOM/quoting/CRLF
contract, snapshot-at-call semantics, deferred revoke) — red-teamed, 5
objections all conceded into contract amendments.

Architecture findings for next arc: 3 (all in icebox, none blocking — none
threatened a Done-when or a charter quality invariant; the one Strong finding
would require editing the no-touch `.github/workflows/ci.yml`, out of this
arc's lawful reach).

Icebox: 4 entries —
1. XLSX export (charter-named next-arc candidate; nothing built toward it
   beyond the CSV seam existing)
2. `scripts/smoke-export.mjs` not wired into any automated gate (Strong;
   deletion test shows it isn't earning its keep as-delivered, but wiring it
   requires touching the no-touch CI workflow — a deliberate charter call for
   the next arc, not a silent expansion of this one)
3. `ExportStatus` union duplicated inline in App.tsx and Toolbar.tsx instead
   of one named type (Worth exploring, below the bar for a bounded-refactor
   ticket at this checkpoint)
4. `buildCsvSync`'s "test-oracle only" rule is comment-only, no lint tooling
   exists in the repo to enforce it (informational; not a regression this arc
   introduced)

Blocked/descoped: none. All 8 map nodes closed on first attempt; zero
attempt failures, zero TOO_BIG splits, zero HALTs, zero replans used.

Sessions used: 11/40 · waves: 2 (wave 1 = #06 solo; wave 2 = #07+#08
parallel, dispatched together per the mergeability-skeptic's independence
finding) · attempts spent: 4/4 build tickets on attempt 1 of 3 (0 retries)
