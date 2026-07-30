# Icebox — xlsx-export (append-only)

Deferred scope and deferred architecture findings. Append-only; run sessions add
to it, the human's next charter harvests it.

- 2026-07-30 | charter | XLSX export — GRADUATED from the icebox into this arc's
  scope. Named a "candidate next arc" in both csv-export §Scope-Out and the
  smoke-gate icebox; now the active arc. Its icebox entries are hereby closed.
- 2026-07-30 | charter | `ExportStatus` inline-union hoist — carried forward,
  still deferred. `'idle' | 'exporting' | 'error'` is written inline in App.tsx
  and Toolbar.tsx instead of a single named type (deviates from the repo's
  as-const string-union convention). This arc's No-touch freezes the model and
  Scope-Out bars refactors beyond the shared export seam, so it stays deferred;
  the xlsx work touches the same status shape, so a future hygiene arc should
  hoist both formats' status to one `export type ExportStatus`. (Origin:
  docs/auto/archive/csv-export/icebox.md, "Worth exploring".)

Other still-open repo-hygiene findings from prior arcs (check-script aggregation,
declared Node floor / engines field, CI push filter to stop double-runs, smoke
robustness — quote-aware split, U+FEFF escape) live in
docs/auto/archive/smoke-gate/icebox.md and are out of this feature arc's scope; a
future hardening arc should harvest them from there.

- 2026-07-30 | s09 arch-checkpoint (wave 4, notes/arch-wave4.md) | Duplicated download
  seam + twin export handlers in App.tsx — `handleExportCsv`/`handleExportXlsx` are
  structurally identical (object-URL → anchor → click → setTimeout(revoke,0) → status),
  differing only in export fn/MIME/filename. Deferred: extract a `downloadBlob(part,
  filename, mimeType)` helper (Strong) and optionally a `useExport({exportFn, filename,
  mimeType})` hook folding the twin status state (Worth exploring). Not actioned this arc —
  charter §Scope-Out routes arch findings to icebox and Priority 1 bars pre-FINISH churn of
  a shipped control for polish. Candidate for a next hygiene arc.
- 2026-07-30 | s09 arch-checkpoint (wave 4) | `ExportStatus` inline-union hoist — RE-CONFIRMED
  (still open; first iceboxed at charter time above). Now written inline in 4 positions
  (App.tsx ×2, Toolbar.tsx ×2) and re-declared in Toolbar.test.tsx. When a hygiene arc lifts
  it, put `export type ExportStatus` in the export/hook module (types.ts is no-touch).
- 2026-07-30 | s09 arch-checkpoint (wave 4) | Chunked-async driver duplicated between csv.ts
  and xlsx.ts (DEFAULT_CHUNK_SIZE, yieldToMacrotaskQueue, snapshot, chunk-loop). Deferred
  (Speculative): a third shared seam `forEachChunkYielding(items, chunkSize, onChunk)` — the
  charter-sanctioned alternative to the forbidden xlsx→csv import. Requires editing no-touch
  csv.ts/xlsx.ts (frozen), so out of scope for this arc; harvest into a hygiene arc.

## End-of-arc architecture pass — xlsx-export (FINISH, s10, 2026-07-30, main @ 45f2f09)
Verdict NONE Blocking (all 5 Done-when green on main; deep modules zip.ts/xlsx-workbook.ts healthy; engine testable through its interface). F1/F2/F3 above re-confirmed unchanged. New:
- [worth-exploring] N1 — intra-file sync/async twin in xlsx.ts: serializeXlsx and exportXlsx are structural twins differing only in data-row assembly (.map().join() vs chunked-yield); byte-identity is a hand-maintained invariant guarded only by the async≡sync test. Remedy: inject a chunk-yield strategy into one shared pipeline (shares F3's forEachChunkYielding idea but lands in TOUCHABLE xlsx.ts — less blocked than F3).
- [speculative] N2 — exportXlsx async tail: the terminal packWorkbook (TextEncoder over whole ~3MB worksheet + per-byte crc32 over every entry + buffer copy) runs in ONE sync macrotask after the last yield. "No UI freeze at 10k" is reduced not eliminated (~10-35ms one-time tail, ~1-2 frames). Not a regression, not a Done-when miss (smoke validates sync path; async byte-equivalence unit-locked). Remedy (future): rolling per-chunk CRC + incremental encoding for true stream-freeness — unwarranted at this scale.
- [monitor] Latent, non-actionable: escapeXml strips &/</> only (not XML-1.0-illegal control chars); number cells use String(value) (NaN/Infinity/exponential for pathological inputs); columnLetter has an untested >26-column branch. None reachable with the seeded finite fixtures; the first two are SHARED with the shipped CSV path (pre-existing, not this arc's regression). Next charter may consciously ignore or harden.
