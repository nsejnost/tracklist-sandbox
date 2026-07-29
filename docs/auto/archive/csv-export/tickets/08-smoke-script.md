# 08 — Build: smoke-export script + README command line
type: build
status: merged
blocked_by: 06
charter_refs: §Scope-In(scripts/smoke-export.mjs, full seeded fixture set through the real export code path), §Done-when 5 (`node scripts/smoke-export.mjs` → `csv:ok rows=10000`), §Scope-Out(README: one line in existing Commands section only)
seams: S3 scripts/smoke-export.mjs stdout + exit code (spec §Seams). Consumes S1 via exportCsv only, loaded under plain Node through the D-0010 resolve hook.
touches: scripts/smoke-export.mjs, README.md
attempts: 1/3
pr: #5
split_generation: 0

## What to build
Spec R9 — the real-path smoke. `scripts/smoke-export.mjs` registers the
~14-line resolve hook via `module.register()` BEFORE any src import (D-0010:
a failed pre-hook import poisons the module cache), then loads the real
`generateSessions()`, real `COLUMNS`, real `exportCsv`; exports all 10,000
fixture rows (import fixtures — never modify, §No-touch); verifies
(a) CRLF-terminated records after the header line = 10,000 exactly,
(b) first char is \uFEFF, (c) the header line — leading \uFEFF stripped —
equals the COLUMNS labels comma-joined, (d) the text ends with CRLF; then
prints exactly `csv:ok rows=10000` and exits 0; any failure → nonzero exit
with a diagnostic line. The script awaits `exportCsv` and counts rows itself
(D-0007 line 7). Plus exactly one line documenting the command in README's
existing Commands section — nothing else in README.

## Acceptance (executable — verbatim from spec R9 + R8 gate)
- run: node scripts/smoke-export.mjs   expect: prints csv:ok rows=10000, exit 0
- run: grep -c smoke-export README.md   expect: 1
- run: test -z "$(grep -rn buildCsvSync src scripts 2>/dev/null | grep -v src/export)"   expect: exit 0 (smoke awaits exportCsv, never the sync oracle)
- run: npm test   expect: exit 0 (no test-file changes in this ticket; 10 baseline files untouched)
- run: npm run typecheck   expect: exit 0

## Work log
- 2026-07-29T04:40Z TICKETS: mergeability-skeptic pass ran (independence holds; finding 4: README Commands section exists at README.md:11, COLUMNS labels comma-free so header-equality check is well-formed; finding 5: zero file overlap with #07 — parallel wave safe). Amendment applied: oracle-ban guard exit-0 form.
- 2026-07-29T06:43Z BUILD wave 2: worker built scripts/smoke-export.mjs + scripts/resolve-ts-hook.mjs (sibling file, registered via module.register() before any src import, per D-0010 ordering rule) + one README Commands line; no red/green loop (no test files in this ticket); Type 2 calls made in-ticket (already delegated by ticket text): sibling hook file over inline data: URL, CRLF-count via match(/\r\n/g) (safe — no fixture field ever contains comma/quote/CR/LF so quoting never triggers), import.meta.dirname for the hook's absolute path; 1 commit (f07709e). Fresh reviewer: Standards clean (1 judgement-call noted — BOM literal byte sequence vs ﻿ escape at smoke-export.mjs:29, left as-is, not a hard violation), Spec-faithfulness clean, all 5 acceptance commands re-run and verified PASS, no-touch clean, package.json/lock untouched. VERDICT PASS, 0 fix rounds needed. INTEGRATE gate: rebase onto origin/main (already current), full local gate re-run (75/75 tests, typecheck 0, build 216k<=230, smoke csv:ok rows=10000, oracle guard clean) — all PASS. PR #5 opened, CI green (2/2 checks), squash-merged 5d1d5a6. Remote branch deletion 403'd in-session (same known limitation as prior sessions) — left in place, cosmetic.
