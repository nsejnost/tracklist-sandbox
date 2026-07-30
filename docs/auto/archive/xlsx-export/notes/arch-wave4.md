# Architecture checkpoint — wave 4 (merged=5, arch_checkpoint_every=5)

Date: 2026-07-30T10:16Z · Session s09 · Trigger: 5th merged ticket (#05).
Scan scope (YAGNI): the arc's touched paths — `src/export/{zip,xlsx,xlsx-workbook,csv}.ts`,
`src/App.tsx`, `src/components/Toolbar.tsx`, co-located tests. Fresh-context scan; read-only.

## Assessed CLEAN (no finding)
- `zip.ts` — genuinely deep module: fiddly CRC-32 + local/central/EOCD layout behind a
  one-function `zipStore(entries) → Uint8Array`; header writers private; CRC exercised
  through the public interface via known vectors (good locality, nothing leaked for testing).
- `xlsx-workbook.ts` — clean model/serializer split; cell-typing edge cases tested through
  `buildWorkbook`, not internals.
- Testability-through-interface strong throughout (yield proven vs a real `setTimeout(0)`
  competitor; snapshot proven via mid-flight mutation; App download/revoke contract asserted
  through the rendered component; cross-control failure isolation covered).
- `bytes as BlobPart` cast (App.tsx) — well-commented TS buffer-type-parameter workaround,
  not a design smell. `xlsx.ts` re-exporting Cell/Workbook/buildWorkbook — minor pass-through,
  acceptable.

## Findings (all triaged → Deferred/icebox; see triage note below)

### F1 — Duplicated download seam + twin handlers (Strong for helper)
- Files: `src/App.tsx` `handleExportCsv` (~60-79) and `handleExportXlsx` (~81-105).
- Problem: the two handlers are structurally identical — same object-URL → anchor →
  click → `setTimeout(revoke,0)` → status dance, differing only in export fn, MIME, filename.
- Proposed: extract `downloadBlob(part, filename, mimeType)`; deeper option a
  `useExport({exportFn, filename, mimeType})` hook folding the twin status `useState`s.
- Strength: Strong (helper) / Worth exploring (hook). Deletion test: concentrates.

### F2 — `ExportStatus` tri-state repeated across App, Toolbar, test (Worth exploring)
- Files: `src/App.tsx` (~19-20), `src/components/Toolbar.tsx` (~15,17),
  `src/components/Toolbar.test.tsx` (~5, re-declares its own `type ExportStatus`).
- Problem: `'idle'|'exporting'|'error'` written inline in 4 prop/state positions + re-invented
  in the test; no single named type. (`types.ts` is no-touch → the type must live in the
  export/hook module, not there.)
- Strength: Worth exploring (compounds with F1). Deletion test: mildly concentrates.
- NB: already carried in icebox.md since charter time — this checkpoint re-confirms it.

### F3 — Chunked-async driver duplicated between csv.ts and xlsx.ts (Speculative, no-touch-blocked)
- Files: `src/export/csv.ts` (~44-79) vs `src/export/xlsx.ts` (~124-160): identical
  `DEFAULT_CHUNK_SIZE`, `yieldToMacrotaskQueue`, snapshot, and chunk-loop skeleton.
- Proposed: a third shared seam `forEachChunkYielding(items, chunkSize, onChunk)` owning
  snapshot + yield cadence (the charter-sanctioned answer, NOT the forbidden xlsx→csv import).
- Strength: Speculative. Requires editing no-touch `csv.ts`/`xlsx.ts` (frozen serialize
  behavior) → auto-Deferred. Deletion test: weakly concentrates (~6-8 lines of control flow).

## Decider triage (charter §Priorities + §Scope-Out; ledger checked, no conflict)
All three → **Deferred/icebox**. Basis: charter §Scope-Out explicitly routes architecture
findings — naming the `ExportStatus` hoist — to "checkpoint/icebox, never into feature
tickets"; all three are Priority-4 polish; every charter Done-when is already met, so nothing
is Blocking; refactoring the shipped App download handlers immediately before FINISH carries
Priority-1 regression risk to a shipped control for zero functional gain; F3 additionally
requires editing no-touch modules. No bounded-refactor ticket is spun (the playbook permits at
most one, but the charter's steer here is explicit toward icebox). No blocking ticket. Logged
as D-0004. These findings become candidate input for the next arc's charter (a hygiene arc).
