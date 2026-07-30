# 02 — Dependency-free stored-ZIP writer
type: build
status: merged
pr: #13
blocked_by: 01
charter_refs: §Scope-In(dep-free ZIP+OOXML serializer, stored entries), §Silence-defaults(stored/uncompressed entries only; CRC32 hand-rolled; no CompressionStream), §Tech constraints(standard JS/Web APIs only)
seams: `src/export/zip.ts` — `zipStore(entries: readonly ZipEntry[]): Uint8Array` (ZipEntry = { name: string; bytes: Uint8Array })
touches: src/export/zip.ts, src/export/zip.test.ts (both new)
attempts: 0/3
split_generation: 0

## What to build
A tiny, dependency-free ZIP container writer that packs already-serialized parts into a valid `.zip` (the `.xlsx` envelope) using **stored/uncompressed** entries only (compression method 0). Pure function over `Uint8Array`: builds local file headers, file data, the central directory, and the end-of-central-directory record, with a hand-rolled CRC-32 (poly 0xEDB88320). No compression, no `CompressionStream`, no dependency. This is the packaging primitive #03 uses to assemble the workbook parts into the final byte stream.

Independent of the OOXML content — it packs arbitrary named byte entries — so it is unit-testable in isolation against the ZIP byte layout from #01's note.

## Acceptance (final — TICKETS s05, from spec.md R1)
- run: `npx vitest run src/export/zip`   expect: exit 0, ≥ 5 assertions — CRC-32 matches the known vectors (`crc32("")=0x00000000`, `crc32("123456789")=0xCBF43926`); local + central headers well-formed and their shared fields (method, CRC, sizes, name) match; EOCD present with correct entry count; output's first 4 bytes are `50 4B 03 04`; one central-directory entry per input.
- run: `npm run typecheck`   expect: exit 0

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #01 (needs the verified stored-ZIP byte layout). One module, one seam → session-sized.
- 2026-07-30T06:15Z s05 (TICKETS): acceptance FINALIZED verbatim from spec R1 (known CRC vectors inlined from spec Testing-decisions). Sizing: 1 module, 1 seam, 1 test file → comfortably one session. Mergeability (skeptic F1): imported by nobody until #03 → merges green in isolation. No fixes needed.
- 2026-07-30T07:16Z s06 (BUILD wave 1): worker built src/export/zip.ts (`zipStore` + `ZipEntry`; hand-rolled CRC-32 poly 0xEDB88320 table-driven; local+central headers from one shared per-entry EntryMeta so shared fields cannot diverge; EOCD; deterministic fixed MS-DOS timestamp; UTF-8 GP-flag 0x0800) + zip.test.ts (describe('Unit'), 5 tests / ~26 assertions, all decoding output via DataView at independent offsets vs literal expected values). TDD: 5 red→green cycles, each proven red via targeted single-field mutation. Two-axis review (fresh reviewer): Standards CLEAN, Spec-faithfulness CLEAN (byte offsets verified vs PKWARE §4.3), 0 fix rounds. INTEGRATE: rebased onto origin/main (68ed863, no move), full local gate GREEN — npm test 85/85 (baseline 80, ratchet up), typecheck 0, build 0 + du 216≤240, csv smoke ok, vitest zip 5/5, no-touch diff clean (only zip.ts+zip.test.ts). PR #13 → CI `ci` success → squash-merged (main d33f85f). Ticket branch delete blocked by proxy (harmless leftover auto/xlsx-export-t02). attempt 1/3 → merged.
