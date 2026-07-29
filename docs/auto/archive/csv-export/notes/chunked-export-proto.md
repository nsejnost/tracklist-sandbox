# Prototype verdict: chunked CSV assembly (ticket 03)

Recorded: 2026-07-29T02:14Z · session 7d94f2a9 · scratch branch
`auto/csv-export-proto-03` (proto/probe-a.mjs, proto/probe-b.mjs,
proto/ts-hook.mjs; never merges, delete at FINISH). Environment: this
container's Node v22.22.2 (CI: Node 22). Probes drove the REAL
`generateSessions()` (10,000 rows) and the REAL `COLUMNS` format functions.

## (a) Chunked output ≡ naive output — YES
Byte-identical (`===` on the full 603,814-char string) at every chunk size
tried (250 / 500 / 1000), assembling into a parts array joined once at the
end. Header + CRLF joins + trailing CRLF, RFC-style quoting in both paths.

## (b) Blocking-slice bounds — YES, comfortably
- Naive synchronous join: 56.2 ms in ONE blocking slice (the freeze the
  charter forbids on large sets — and the number chunking must beat).
- Chunked (await setTimeout(0) between chunks):
  | chunk | slices | max sync slice | wall (Node) |
  | 250   | 40     | 2.01 ms        | 67 ms  |
  | 500   | 20     | 2.76 ms        | 38 ms  |
  | 1000  | 10     | 7.11 ms        | 51 ms  |
- Browser deltas from research (§4, csv-interop.md): nested-setTimeout clamp
  ≈4 ms/chunk after the 5th → browser wall ≈ +60–140 ms on these counts; max
  sync slice is the responsiveness metric and stays in low single digits.
- Reading for the ADR: chunk 500 is the sweet spot here (fewest ms per slice
  per unit wall time); anything 250–1000 satisfies the charter. Rates will
  differ on user hardware; the ORDER of magnitude (ms-per-500-rows) is the
  finding.

## (c) Plain-node smoke path over the real code — YES, with one hard ordering rule
- Raw `import('../src/utils/columns.ts')` and `fixtures.ts` FAIL under plain
  node (ERR_MODULE_NOT_FOUND on their extension-less internal edges
  `./format`, `../types`) — exactly the §5a pinch. `types.ts` (zero imports)
  loads raw fine.
- `module.register('./ts-hook.mjs')` with a ~14-line resolve hook (retry
  failed relative extension-less specifiers with `.ts`) then dynamic-importing
  the graph → **works**: real COLUMNS (6 defs) + real fixtures (10,000 rows)
  load and format correctly (row0: `2018-01-02 | Canal Towpath | 16.29 km |
  1:45:37 | 6:29 /km | easy`).
- **Ordering rule discovered**: the hook must be registered BEFORE any import
  attempt touches the src graph. A failed pre-hook import poisons the module
  cache and the same specifier keeps failing after registration (probe-a/-b
  split proves it; the combined script reproduced the failure
  deterministically). The smoke script must register the hook at the very top
  and only then dynamic-import.
- Consequence for the engine design: a src/export module with only
  `import type` dependencies loads under plain node with NO hook (type
  stripping erases the specifiers); the hook is needed only to feed it the
  REAL fixtures + COLUMNS from the smoke script. Both mechanisms compose:
  param-shaped engine (type-only imports) + hook in scripts/ for the data.

## What survives (for decision 04)
1. Engine: pure, parameter-shaped `(rows, columns)` core with type-only src
   imports; chunked driver awaiting a setTimeout(0)-based yield; parts-array
   assembly, single join (or Blob parts — equivalent at this scale).
2. Chunk size: 500 (defensible range 250–1000; measurements above).
3. Smoke: `scripts/smoke-export.mjs` = register hook (top of file) → dynamic
   import real fixtures/columns/engine → compare/verify → print. No flags, no
   deps, Done-when command unchanged.
