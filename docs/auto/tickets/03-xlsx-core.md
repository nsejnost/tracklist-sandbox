# 03 — Workbook model + OOXML serializer (the xlsx engine core)
type: build
status: open
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

## Acceptance (provisional — finalized at TICKETS from spec.md; anchored to charter Done-when 2)
- run: `npx vitest run src/export/xlsx`   expect: exit 0, ≥ 10 tests — `distanceKm` asserted a number cell (`10.4`); `date`/`routeName`/`durationSec`/`paceSecPerKm`/`effort` asserted string cells holding the table's formatted text; header row includes `Distance (km)`; `serializeXlsx` output carries ZIP magic + `[Content_Types].xml` + `xl/worksheets/sheet1.xml`.
- run: `npm run typecheck`   expect: exit 0
- run: `npm test`   expect: exit 0, total > 80 (new tests added, ratchet holds)

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #01 (OOXML/ZIP facts) and #02 (zipStore). Cell-typing contract is charter-pinned — no decision node. Likely split candidate at TICKETS (model / serialize).
