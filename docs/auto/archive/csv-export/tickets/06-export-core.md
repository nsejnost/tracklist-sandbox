# 06 — Build: export core (src/export/csv.ts — CSV text + chunked engine)
type: build
status: merged
blocked_by: 01, 04, 05
charter_refs: §Scope-In(CSV export of current view; chunked/async), §Done-when 1 (vitest src/export/ ≥12), §Silence-defaults(Export fidelity WYSIWYG; exact-string assertions; no new deps), §Tech constraints
seams: S1 src/export/csv.ts (new; fixed by D-0007, signatures normative from spec §Seams): buildCsvSync(rows: readonly RunSession[], columns: readonly ColumnDef[]): string · exportCsv(rows: readonly RunSession[], columns: readonly ColumnDef[], opts?: ExportCsvOptions): Promise<string> · interface ExportCsvOptions { chunkSize?: number } (default 500 via non-exported constant) · const CSV_BOM = "\uFEFF". buildCsvSync is the test oracle — banned outside src/export/.
touches: src/export/**
attempts: 1/3
pr: #4
split_generation: 0

## What to build
Spec R1+R2+R3 — the DOM-free engine; no UI in this ticket. `src/export/csv.ts`
exports exactly the S1 surface. R1 text policy: `buildCsvSync` emits CSV_BOM as
first char (D-0004), one header row from the passed columns' labels (D-0001),
one line per row in array order with cells from each column's `format(row)`
(WYSIWYG), RFC-minimal quoting — quote only fields containing comma, quote, CR,
or LF; escape `"` by doubling (D-0002) — CRLF terminating every record
including the last (D-0003); empty rows array → BOM + header line only
(D-0006); column subset and order = exactly the `columns` argument. R2 chunked
driver: `exportCsv` resolves byte-identical to `buildCsvSync` for the same
arguments (any chunkSize ≥ 1, non-multiple row counts included), yields
macrotask-class between chunks (D-0009: `await new Promise(r => setTimeout(r, 0))`),
shallow-copies both argument arrays synchronously at entry (snapshot-at-call,
D-0007 line 6), and rejects with the same error `buildCsvSync` would throw
when a column `format` throws. R3: no DOM references, only `import type` from
src — plain Node loads it directly. Tests T1–T12 per spec §Testing decisions
in `src/export/csv.test.ts`: expected strings composed as CSV_BOM + "..." /
`\uFEFF` escapes (never pasted invisible literals), rows via `makeSession`,
REAL timers (never vi.useFakeTimers), no internal mocking — T12 uses a
throwing `format` as the error seam.

## Acceptance (executable — verbatim from spec R1/R2/R3 + R8 gate)
- run: npx vitest run src/export/   expect: exit 0; exactly the 12 tests T1–T12 passing (spec's enumerated set; satisfies Done-when 1 ≥12 and keeps #07's =80 pin sound — do not add a 13th)
- run: node --input-type=module -e "import('./src/export/csv.ts').then(m => { if (typeof m.exportCsv !== 'function' || typeof m.buildCsvSync !== 'function') throw new Error('missing exports'); console.log('load:ok'); })"   expect: prints load:ok, exit 0
- run: test -z "$(grep -rn buildCsvSync src scripts 2>/dev/null | grep -v src/export)"   expect: exit 0 (oracle banned outside src/export/; tolerant of scripts/ not existing yet)
- run: npm test   expect: exit 0; all 63 baseline tests green; no existing test file modified
- run: npm run typecheck   expect: exit 0

## Work log
- 2026-07-29T04:53Z TICKETS gate: Auditor PASS (4/4, no-touch clean). Flag resolved here: acceptance pinned to exactly T1–T12 so #07's =80 total stays deterministic.
- 2026-07-29T04:40Z TICKETS: mergeability-skeptic pass ran (independence holds; finding 3: #06 alone leaves main green — no unused-export lint, dist stays 216, tests 63→75). Amendment applied: oracle-ban guard rewritten to exit-0-on-pass form.
- 2026-07-29T05:36Z-05:42Z BUILD wave 1, attempt 1: worker built src/export/csv.ts + csv.test.ts in worktree auto/csv-export-t06. Red-run evidence: T1 genuinely red first (module didn't exist: "Cannot find module './csv'"), T9 genuinely red (`exportCsv is not a function` before implementation existed); T2-T8/T10-T12 went green on first try because T1/T9's minimal implementations already covered the full R1/R2 policy — recorded honestly per worker report rather than staged as individually red. Commit cf036ab. Acceptance verified: vitest src/export/ 12/12, load probe ok, grep guard ok, npm test 75/75 (63 baseline + 12 new, no existing test file touched), typecheck clean.
- 2026-07-29T05:43Z-05:46Z Review (fresh reviewer subagent, diff-only + ticket + codingstandards.md): Axis 1 — hard finding: CSV_BOM defined via raw pasted invisible UTF-8 BOM bytes in src/export/csv.ts instead of the `﻿` escape (exactly the invisible-literal hazard D-0007's contract warns about); minor judgement-call finding: duplicated 2-line header-emission logic between buildCsvSync/exportCsv. Test policing clean (12 its, no .skip/.todo, T3 cross-checked against real format.ts, no tautologies). Axis 2 spec-faithfulness: clean vs R1/R2/R3 (sync buildCsvSync verified no-await, snapshot verified synchronous pre-first-await via T11, chunk-boundary yield logic verified correct at boundaries); one process note (ticket doc itself, not src/export/, was touched in the worktree — expected, see integration note below, not a real scope violation). Verdict: FINDINGS 2 (0 unwaivable spec findings).
- 2026-07-29T05:46Z-05:49Z Fix round 1/2: same worker context fixed both findings — CSV_BOM now `export const CSV_BOM = '﻿';` (escape verified via od -c raw-byte inspection), added shared `csvHeader()` helper deduping the header-emission logic. Commit 7a7667f. Re-verified: vitest 12/12, load probe ok, npm test 75/75, typecheck clean.
- 2026-07-29T05:49Z-05:53Z Integration: the worker's worktree was cut from origin/main which predates docs/auto/ entirely (docs/auto only exists on the auto/csv-export coordination branch), so the worker recreated this ticket file locally to append its Work log — that file was never intended to reach main. Orchestrator built a clean PR branch (auto/csv-export-t06-pr) containing only src/export/csv.ts + src/export/csv.test.ts (git checkout of just those paths onto a fresh branch from origin/main), then ran the full INTEGRATE gate on the rebased result: npm test 75/75, typecheck clean, npm run build exit 0 + du -sk dist/ = 216 (baseline 216, ratchet ≤230), vitest src/export/ 12/12, load probe ok, grep guard ok, `git diff origin/main --name-only` = exactly src/export/csv.ts + src/export/csv.test.ts (no-touch zones clean). Pushed, opened PR #4, both CI check runs green, squash-merged as c9dfb03. Ticket closed.
