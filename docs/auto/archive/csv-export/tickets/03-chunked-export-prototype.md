# 03 — Prototype (logic): chunked CSV assembly over 10k fixture rows
type: prototype
status: merged
blocked_by: 02
charter_refs: §Destination(no freezing on large sets), §Glossary(large result set — all sizes identical), §Done-when(smoke prints csv:ok rows=10000)
seams: -
touches: scratch branch auto/csv-export-proto-03 only; verdict → docs/auto/notes/chunked-export-proto.md
attempts: 0/3
pr: -
split_generation: 0

## Question this answers (throwaway code; no tests, no polish; never merges)
Does a chunked, awaitable CSV assembly loop over the real 10,000-row fixture
set (a) produce byte-identical output to a naive synchronous join, (b) keep
each synchronous slice bounded (measure max per-chunk wall time at a few chunk
sizes, e.g. 250/500/1000 rows), and (c) run under plain `node` importing the
TS fixtures + a TS assembly module directly (proving the smoke-script
mechanism from ticket 02's type-stripping facts)?

Method: small script(s) on the scratch branch pushing the state through the
hard-to-eyeball cases; print measurements and the full comparison result after
every action; the transcript is the artifact. Use `generateSessions()` from
src/data/fixtures.ts (import only — no-touch) and the real COLUMNS format
functions so measurements reflect the true per-cell cost.

Verdict → docs/auto/notes/chunked-export-proto.md (what survived, numbers,
what the ADR may cite). Scratch branch deleted at FINISH.

## Acceptance (executable)
- run: test -f docs/auto/notes/chunked-export-proto.md && grep -ciE 'identical|max.*ms|chunk' docs/auto/notes/chunked-export-proto.md   expect: file exists, ≥3 (all three sub-questions answered with numbers)

## Work log
- 2026-07-29T02:14Z session 7d94f2a9: all 3 sub-questions answered
  affirmatively (notes/chunked-export-proto.md; scratch branch
  auto/csv-export-proto-03 pushed). (a) byte-identical at 250/500/1000;
  (b) max sync slice 2.0–7.1 ms vs 56 ms naive single-slice, chunk 500 sweet
  spot; (c) module.register ts-resolve hook works with a hard ordering rule
  (register before ANY src import — pre-hook failures poison the module
  cache), type-only-import engines need no hook. Status: merged = verdict
  landed on coordination branch (prototype code never merges).
