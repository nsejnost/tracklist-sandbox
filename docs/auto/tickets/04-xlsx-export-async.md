# 04 — Async chunked exportXlsx wrapper
type: build
status: done
blocked_by: 03
charter_refs: §Scope-In(async chunked exportXlsx mirroring exportCsv; no UI freeze at 10k), §Silence-defaults(follow existing convention — the shipped exportCsv pattern), §No-touch(src/export/csv.ts frozen — mirror it, do not extract from it)
seams: `src/export/xlsx.ts` — `exportXlsx(rows, columns, opts?): Promise<Uint8Array>`
touches: src/export/xlsx.ts, src/export/xlsx.test.ts
attempts: 1/3
split_generation: 0

## What to build
The async, chunked entry point the UI calls — the exact shape of the shipped `exportCsv` (src/export/csv.ts), reimplemented for xlsx (csv.ts is No-touch, so mirror its pattern, never import/extract from it). `exportXlsx`:
- snapshots both array args synchronously at call time (later mutation of the caller's arrays must not affect the in-flight export — the `exportCsv` guarantee),
- processes rows in chunks (default chunk size matching `exportCsv`'s 500), yielding to the macrotask queue between chunks so a 10k-row export never freezes the UI,
- returns the finished `Uint8Array` (built via `serializeXlsx`/the model from #03).

Pure/headless — no DOM. The download wiring (Blob, filename) lives in the UI ticket #05.

## Acceptance (final — TICKETS s05, from spec.md R4)
- run: `npx vitest run src/export/xlsx`   expect: exit 0 — a test proves the arg-snapshot guarantee (mutating an input array after the call does not change the output) and that the async `exportXlsx` result equals the synchronous `serializeXlsx` output for the same input.
- run: `npm run typecheck`   expect: exit 0

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #03. Mirrors the proven exportCsv async/chunk/yield pattern; small wrapper → session-sized. Shared-vs-per-format status shape is a #05 concern (charter Type-2), not here.
- 2026-07-30T06:15Z s05 (TICKETS): acceptance FINALIZED verbatim from spec R4. Grounded against `src/export/csv.ts` on main: mirror `ExportCsvOptions { chunkSize?: number }`, `DEFAULT_CHUNK_SIZE = 500`, sync arg-snapshot, `setTimeout(0)` macrotask yield — csv.ts is No-touch, so mirror the pattern, never import from it. Sizing: 1 seam, small wrapper → one session. Mergeability (skeptic F1): imports `serializeXlsx` (#03 in); unimported by app → merges green.
- 2026-07-30T09:31Z s08 (BUILD wave 3): built→reviewed→FIXED→re-reviewed→merged (PR #16, main f926f62). attempt 1. Worker TDD 3 red→green cycles at `exportXlsx` seam (equality-to-serializeXlsx; arg-snapshot guarantee; macrotask-yield), red evidence logged (TypeError before symbol existed; empty-workbook diff with snapshot removed; competitor-timer-first with yield disabled). D-0002 logged (mirror exportCsv locals). Two-axis review round 1: Standards clean (1 judgement-call: describe('exportXlsx')→'Unit', fixed); Spec **HARD**: chunk loop was hollow — O(rows) work still ran monolithically in `serializeXlsx` after the yields → real UI freeze at 10k, violating charter §Scope-In "no UI freeze at 10k". Fix round 1: extracted shared `packWorkbook`/`headerRowXml`/`worksheetXml` helpers (one source of truth for bytes), moved per-chunk `buildWorkbook` cell-typing + `rowXml` rendering INSIDE the chunk loop with the exportCsv between-chunk yield predicate; `serializeXlsx` output byte-identical (verified by the async≡sync equality test). Re-review CLEAN, HARD resolved, 0 new findings (1/2 review cycles). INTEGRATE: rebased onto origin/main (4e3fb44, post-#06) → full local gate GREEN (npm test 104/104 ratchet-up from 101, vitest xlsx 19/19, typecheck 0, build 0 + du 216≤240, csv smoke ok, xlsx smoke ok, no-touch = only xlsx.ts+xlsx.test.ts) → PR #16 CI `ci` success → squash-merged. merged=4.
