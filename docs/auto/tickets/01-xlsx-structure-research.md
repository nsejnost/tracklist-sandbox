# 01 — Research: minimal valid .xlsx structure + dependency-free stored-ZIP byte layout
type: research
status: open
blocked_by: -
charter_refs: §Scope-In(dep-free ZIP+OOXML serializer, stored entries), §Silence-defaults(OOXML minimal parts; stored ZIP; hand-rolled CRC32), §Tech constraints(Uint8Array/TextEncoder/CRC32; no CompressionStream), §Priorities 1 (zero regressions — a malformed .xlsx is the arc's top risk)
seams: - (research; no code)
touches: docs/auto/notes/xlsx-structure.md (new)
attempts: 0/3
split_generation: 0

## What to find (facts from primary sources — found, never decided)
Hand-rolling a valid `.xlsx` is the riskiest part of the arc; de-risk it before BUILD by pinning the exact byte- and part-level requirements from primary sources (ECMA-376 / OOXML; the PKWARE ZIP APPNOTE for the container). Produce `docs/auto/notes/xlsx-structure.md` capturing, each claim cited to its owning source:

1. **Minimal OOXML part set** for a single-sheet workbook that Excel, Google Sheets, and Numbers all open cleanly: which parts are mandatory (`[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/worksheets/sheet1.xml`) and the exact minimal XML each needs. Confirm whether `xl/styles.xml` is required for a file with no styling (charter bars styling — verify a styles-less file is valid) and what the smallest conformant `sheet1.xml` row/cell markup is.
2. **Cell encoding** for the two cell kinds this arc emits: an inline string cell (`t="inlineStr"` with `<is><t>…</t></is>`, or the `sharedStrings` alternative) and a **number** cell (bare `<v>` no `t`). Note the XML-escaping rules for string content. (Inline-strings vs sharedStrings is a charter Type-2 choice; record both so BUILD can pick the smallest reversible.)
3. **Stored-ZIP (method 0) byte layout**, exactly: local file header (signature, version, flags, method 0, mod time/date, CRC-32, comp size = uncomp size, name length, name), file data, central directory file header, end-of-central-directory record; which fields must match between local and central headers; how CRC-32 is computed (polynomial 0xEDB88320, standard table). Enough detail to write it from `Uint8Array` with no library.
4. A **known-good minimal reference**: the smallest byte sequence / part set proven to open in a real spreadsheet app, to serve as the build worker's oracle and the reviewer's yardstick.

## Acceptance (research ticket — no red-green loop)
- run: `test -f docs/auto/notes/xlsx-structure.md`   expect: file exists
- run: `grep -c "Content_Types" docs/auto/notes/xlsx-structure.md`   expect: ≥ 1 (part set documented)
- Manual gate (Auditor at DECIDE close): every claim cites a primary source; the note is sufficient to write the zip writer (#02) and serializer (#03) without further external lookup.

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Runs in the FOREGROUND during DECIDE (rails: research never a background agent). Feeds #02 and #03; no decision node depends on it (charter pre-decided the shape), so it closes by producing its note.
