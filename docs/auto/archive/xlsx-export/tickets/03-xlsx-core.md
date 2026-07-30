# 03 — Workbook model + OOXML serializer (the xlsx engine core)
type: build
status: merged
blocked_by: 01, 02
charter_refs: §Destination, §Scope-In(native xlsx of the current view; cell-typing contract; sync test-oracle builder), §Silence-defaults(cell typing; minimal OOXML parts; inline-vs-sharedStrings Type-2; Sheet1), §No-touch(src/types.ts + src/utils/columns.ts read-only; src/export/csv.ts frozen)
seams: `src/export/xlsx.ts` — `buildWorkbook(rows, columns)` (in-memory typed cell model) and `serializeXlsx(rows, columns): Uint8Array`; helper `src/export/xlsx-workbook.ts`
touches: src/export/xlsx.ts, src/export/xlsx-workbook.ts, src/export/*.test.ts (all new)
attempts: 0/3
split_generation: 0

## What to build
The dependency-free xlsx engine, synchronous. Two seams:
- `buildWorkbook(rows, columns)` → an in-memory workbook model: one sheet, a header row from the column labels (with the `distanceKm` label rewritten to `Distance (km)`), then one row per session. Each cell is typed per the **charter contract**: `distanceKm` → a **number** cell carrying the raw `row.distanceKm` value; every other column (`date`, `routeName`, `durationSec`, `paceSecPerKm`, `effort`) → a **string** cell carrying that column's existing `format(row)` output (the exact text the table shows). Reads `src/types.ts`/`src/utils/columns.ts` read-only (No-touch).
- `serializeXlsx(rows, columns)` → `Uint8Array`: render the minimal OOXML part set (per #01) from the model and pack it via `zipStore` (#02). Stored entries only; no styling parts; XML-escape all string content.

The in-memory model is the primary **test oracle** — tests assert per-column cell *type* and value on it directly (no xlsx parser, per the dependency freeze); a second test asserts `serializeXlsx` output is a structurally valid workbook (ZIP magic + expected parts present) by scanning bytes.

TICKETS may split this into model vs serialize if sizing trips; the worker's TOO_BIG tripwire is the backstop.

## Acceptance (final — TICKETS s05, from spec.md R2+R3; charter Done-when 2)
- run: `npx vitest run src/export/xlsx`   expect: exit 0, ≥ 10 tests asserting, on the model: `distanceKm` is a **number** cell holding `10.4` (raw, not `"10.40 km"`); `date`/`routeName`/`durationSec`/`paceSecPerKm`/`effort` are **string** cells holding `col.format(row)` (including `durationSec`/`paceSecPerKm` as strings **despite** `numeric: true`); the header row includes `Distance (km)` and the other labels verbatim. And on the bytes: `serializeXlsx` output carries the ZIP magic (`50 4B 03 04`) + `[Content_Types].xml` + `xl/worksheets/sheet1.xml`. At least one row uses a value containing `&`/`<` to prove XML escaping (spec red-team #5).
- run: `npm run typecheck`   expect: exit 0
- run: `npm test`   expect: exit 0, total > 80 (new tests added, ratchet holds)

## Implementation decision to log at BUILD
- **Inline strings over `sharedStrings`** (Type-2, spec §Implementation-decisions): string cells use `t="inlineStr"` with `<is><t>…</t></is>`. Log `D-####` in this Work log when made. Rationale pre-pinned by research §3 + charter §Silence-defaults (smallest reversible).

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #01 (OOXML/ZIP facts) and #02 (zipStore). Cell-typing contract is charter-pinned — no decision node. Likely split candidate at TICKETS (model / serialize).
- 2026-07-30T06:15Z s05 (TICKETS): acceptance FINALIZED verbatim from spec R2+R3. **Sizing decision — NOT split.** The heuristic flags 2 seams + "and", but: (a) spec is FROZEN and authoritatively assigns R2+R3→#03 with a single ≥10-test acceptance and a documented TOO_BIG backstop; (b) `buildWorkbook` and `serializeXlsx` are one small (~150-line) tightly-coupled module (serialize consumes the model) — splitting would fragment the module and add a cross-ticket file dependency; (c) the worker's TOO_BIG tripwire is the pre-agreed runtime backstop if it actually trips at BUILD (split into model/serialize then, generation ≤2). Mergeability (skeptic F1): imports zip.ts (#02 in) + reads types.ts/columns.ts (no-touch); unimported by app → merges green in isolation.
- 2026-07-30T08:29Z s07 (BUILD wave 2): built→reviewed→merged (PR #14, squash-merged to main 804931d). attempts 1/3. NOT split — worker finished clean without tripping TOO_BIG.
  - **Files (3 new):** `src/export/xlsx-workbook.ts` (Cell discriminated union + Workbook interface + `buildWorkbook` oracle), `src/export/xlsx.ts` (public seams: re-exports buildWorkbook, adds `serializeXlsx`; five OOXML part constants + inline-string worksheet renderer + XML escaper + bijective column-letter helper), `src/export/xlsx.test.ts` (16 tests). No No-touch file modified; `zipStore` reused (no ZIP/CRC reimplementation); no dependency added; not wired into UI (engine-only, as scoped).
  - **D-0001 (Type 2):** inline strings (`t="inlineStr"` + `<is><t>…</t></is>`) over `sharedStrings`. Source order ①ledger(empty)→②charter §Silence-defaults→ satisfied by charter + research note §3 (smallest reversible; statelessly serializable in the chunked path). Logged to decisions.md.
  - **TDD red-run evidence:** RED-1 `buildWorkbook` — `expected '' to be 'Sheet1'` → green after model impl. RED-2 `serializeXlsx` — 6 serializer tests red vs stub (`expected [undefined…] to deeply equal [80,75,3,4]`; `expected '' to contain '[Content_Types].xml'`; number-cell/inlineStr/XML-escape/row-numbering) while 10 model tests already green → all green after serializer impl.
  - **Review (fresh reviewer, two-axis):** Standards — 0 hard violations, 2 judgement-calls (Duplicated-Code: `serializeXlsx` re-hardcodes `Sheet1` in WORKBOOK_XML rather than reading `wb.sheetName`; Middle-Man: xlsx.ts re-exports the model seams — justified by the single-seam ticket decl). Neither blocks; sheet name is charter-fixed to `Sheet1`, so no scope movement — left as-is. Spec-faithfulness — CLEAN (cell-typing contract, header rewrite, 5-part set, inline strings, XML escaping, zipStore reuse, no-touch all verified). Test policing — 16 tests at the seams, red evidence present, no tautology/impl-coupling, no .skip/.todo. VERDICT: CLEAN, 0 fix rounds.
  - **INTEGRATE:** rebased onto origin/main (no move) → full local gate GREEN: `npm test` 101/101 (baseline 85, ratchet up), typecheck 0, build 0 + `du -sk dist` 216 ≤ 240, csv smoke `csv:ok rows=10000`, `npx vitest run src/export/xlsx` 16/16, no-touch diff = only the 3 new files → pushed branch → PR #14 → CI `ci` check-run success → squash-merged → main 804931d. Remote ticket branch `auto/xlsx-export-t03` delete blocked by proxy from this headless session (harmless; human may delete).
