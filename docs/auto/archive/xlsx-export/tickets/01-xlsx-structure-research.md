# 01 — Research: minimal valid .xlsx structure + dependency-free stored-ZIP byte layout
type: research
status: merged
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
- 2026-07-30T04:36Z s03 (DECIDE): research DONE → docs/auto/notes/xlsx-structure.md. Primary sources: PKWARE APPNOTE.TXT (§4.3.7/4.3.12/4.3.16/4.4.7 ZIP layout + CRC-32 0xEDB88320), Office Open XML anatomy + Brendan Long (minimal part set; styles/sharedStrings optional), ECMA-376 Parts 1&2. EMPIRICALLY VERIFIED in-container: hand-built minimal 5-part STORED xlsx → unzip -l lists 5 parts, zipfile testzip OK (CRC), and openpyxl (real reader) opened it reading A2=10.4 as float + B2 as str — proving the cell-typing contract at the format level (bare <v> = number; t="inlineStr" = string) and that no styles.xml/sharedStrings.xml is needed. Recommendation for #03: inline strings (smallest reversible; D-entry to be logged by #03). Acceptance: `test -f notes/xlsx-structure.md`✓; `grep -c Content_Types`✓. Foreground; no code merged (scratchpad verify script is throwaway). status→merged.
