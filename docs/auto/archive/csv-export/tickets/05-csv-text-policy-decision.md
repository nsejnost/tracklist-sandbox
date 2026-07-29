# 05 — Decision: CSV text policy (quoting, EOL, BOM, header, filename, empty view)
type: decision
status: merged
blocked_by: 02
charter_refs: §Destination(opens in any spreadsheet program), §Silence-defaults(WYSIWYG fidelity; exact-string test assertions), §Scope-Out(no delimiter/quoting choosers — one fixed policy), §Glossary(view)
seams: -
touches: docs/auto/decisions.md
attempts: 0/3
pr: -
split_generation: 0

## What must be decided (Decision Protocol; evidence = ticket 02 notes)
One fixed, test-assertable text policy — no user choices exist (Scope-Out):
1. Header row: included? Labels = visible column labels (charter WYSIWYG) —
   confirm and log.
2. Quoting/escaping: RFC 4180 rules as researched (which chars force quotes,
   quote doubling) — adopt or state the exact deviation.
3. Line endings: CRLF (RFC) vs LF — decide from ticket 02 spreadsheet-app
   facts against §Destination.
4. BOM: emit or not — decide from ticket 02 Excel/Sheets/LibreOffice facts
   against §Destination.
5. Filename pattern for the download (static vs date-stamped; en-US terse) —
   nearest existing convention, smallest reversible.
6. Empty view (0 matching rows): what the export produces (header-only file /
   disabled control) — WYSIWYG default, smallest reversible.

Each item is likely Type 2 (undoable in one ticket) → one-line D-entries by
ranked priorities; escalate any that fails the reversibility test. Exact
expected strings for tests derive from these entries. Auditor check before
close.

## Acceptance (executable)
- run: grep -cE '^D-[0-9]{4}' docs/auto/decisions.md   expect: ≥6 lines covering items 1–6 (ids cited in Work log)

## Work log
- 2026-07-29T02:22Z session 7d94f2a9: all 6 items decided via Decision
  Protocol (routine Type 2 path — evidence-embedded questions straight to a
  fresh-context Decider; charter+empty-ledger only). Results: D-0001 header
  row from visible labels (charter-direct), D-0002 RFC-minimal quoting,
  D-0003 uniform CRLF terminators, D-0004 emit BOM, D-0005 static
  tracklist.csv, D-0006 empty view -> header-only file (charter-direct).
  Decider: 0 Type-1 flags, 0 unanswerable, coherence confirmed. Auditor
  (fresh context): PASS 6/6 + coherence, quote-checked charter basis per
  entry, no Type-1 smuggling, no Scope-Out/No-touch conflicts. Exact expected
  strings for tests now derivable: BOM + header + CRLF-terminated records,
  minimal quoting. Status: merged = decisions in ledger (no PR for decision
  tickets).
