# 04 — Decision: export engine seam, chunking mechanism, UI state home
type: decision
status: merged
blocked_by: 02, 03
charter_refs: §Tech constraints(zustand pattern, Blob/anchor download, no new deps), §Silence-defaults(persistence: transient export state; smallest reversible), §Scope-In(chunked/async with in-progress state; failure inline), §Priorities
seams: to be fixed by this decision (the src/export public API)
touches: docs/auto/decisions.md
attempts: 0/3
pr: -
split_generation: 0

## What must be decided (Decision Protocol; Griller → Decider; evidence = tickets 02+03 notes)
1. The src/export public API shape the arc's tickets/tests/smoke consume —
   e.g. pure row→CSV-text builder + a chunked async driver; generator vs
   callback vs promise-of-parts; what the UI awaits; how progress/abort (if
   any) surface. Interface-shaping across tickets → expect Type 1 (ADR,
   red-team, rollback notes).
2. Chunking mechanism + chunk size: the yield primitive (portable browser+Node
   per ticket 02 facts), chunk size from ticket 03 measurements.
3. Where transient export UI state lives: component-local (App's `refreshing`
   precedent) vs a small exportStore (createStore factory pattern) — decide by
   charter conventions + smallest-reversible; no persistence either way.
4. Failure surface shape on the control (charter pins: inline, control's own
   state, no notifications): what states exist (idle/exporting/error), how
   error text renders at the existing aria patterns.

Output: D-entries (and one ADR if Type 1 confirmed) in decisions.md; the
chosen seam names recorded verbatim for spec.md. Auditor check before close.

## Acceptance (executable)
- run: grep -cE '^D-[0-9]{4}|^## D-[0-9]{4}' docs/auto/decisions.md   expect: ≥1 new entry covering all four items (ids cited in Work log)
- run: grep -qiE 'seam|api' docs/auto/tickets/04-export-engine-decision.md   expect: Work log records the chosen seam signature(s)

## Work log
- 2026-07-29T02:55Z session 7d94f2a9: full Decision Protocol run. Griller
  (ticket+notes context) produced the seam question, 4 structurally distinct
  options embedded. Fresh Decider chose Option A -> ADR D-0007 (Type 1).
  Red-team raised 5 objections (sync-builder nuisance, unenforceable
  type-only imports, BOM literal/double-BOM hazards, unproven yield,
  unrecorded snapshot semantics) + runner-up case for the generator shape;
  Decider conceded all 5 into contract amendments (buildCsvSync rename+ban+
  grep guard, plain-node load probe in 06 acceptance, CSV_BOM constant +
  single-writer rule + escape-only test convention, mandatory chunkSize:1
  interleaving test, snapshot-at-call shallow-copy contract) and refuted the
  runner-up (for-awaited generators are microtask chains). Type 2 companions:
  D-0008 (chunk 500 default), D-0009 (macrotask-class yield), D-0010 (hook
  confined to smoke script). First Auditor pass FAILED closure: ticket items
  3+4 undecided -> remedy: fresh Decider decided D-0011 (state home = App
  useState, refreshing precedent) and D-0012 (idle/exporting/error control,
  role=status aria-live=polite adjacent element, clear-on-retrigger).
  CHOSEN SEAM (verbatim, for spec.md):
    module src/export/csv.ts, named exports:
    buildCsvSync(rows: readonly RunSession[], columns: readonly ColumnDef[]): string
    exportCsv(rows: readonly RunSession[], columns: readonly ColumnDef[], opts?: ExportCsvOptions): Promise<string>
    interface ExportCsvOptions { chunkSize?: number }   // default 500, non-exported constant
    const CSV_BOM = "\uFEFF"
  D-ids on this ticket: D-0007 (ADR) + D-0008..D-0012.
