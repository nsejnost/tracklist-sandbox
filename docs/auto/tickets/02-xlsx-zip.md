# 02 — Dependency-free stored-ZIP writer
type: build
status: open
blocked_by: 01
charter_refs: §Scope-In(dep-free ZIP+OOXML serializer, stored entries), §Silence-defaults(stored/uncompressed entries only; CRC32 hand-rolled; no CompressionStream), §Tech constraints(standard JS/Web APIs only)
seams: `src/export/zip.ts` — `zipStore(entries: readonly ZipEntry[]): Uint8Array` (ZipEntry = { name: string; bytes: Uint8Array })
touches: src/export/zip.ts, src/export/zip.test.ts (both new)
attempts: 0/3
split_generation: 0

## What to build
A tiny, dependency-free ZIP container writer that packs already-serialized parts into a valid `.zip` (the `.xlsx` envelope) using **stored/uncompressed** entries only (compression method 0). Pure function over `Uint8Array`: builds local file headers, file data, the central directory, and the end-of-central-directory record, with a hand-rolled CRC-32 (poly 0xEDB88320). No compression, no `CompressionStream`, no dependency. This is the packaging primitive #03 uses to assemble the workbook parts into the final byte stream.

Independent of the OOXML content — it packs arbitrary named byte entries — so it is unit-testable in isolation against the ZIP byte layout from #01's note.

## Acceptance (provisional — finalized at TICKETS from spec.md; anchored to charter Done-when)
- run: `npx vitest run src/export/zip`   expect: exit 0, ≥ 5 assertions — CRC-32 matches known vectors; local+central headers well-formed; EOCD present with correct entry count; round-trippable by a standard unzip (structural check).
- run: `npm run typecheck`   expect: exit 0
- Seam contract: `zipStore` returns a byte stream whose first 4 bytes are the local-file-header signature `PK\x03\x04` and which contains one central-directory entry per input.

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #01 (needs the verified stored-ZIP byte layout). One module, one seam → session-sized.
