# TICKETS mergeability-skeptic pass — xlsx-export

Ran at TICKETS (session s05, 2026-07-30) by a fresh-context subagent tasked to
attack the independence/mergeability claims of tickets #02–#06 against the frozen
spec and the live codebase on `main`. Verdict: **yes-with-fixes** — the DAG is
structurally sound and independently mergeable; three fixes (all on #05) landed in
the ticket files before the gate.

## DAG under test
01 (merged) → 02 ; {01,02} → 03 ; 03 → 04 → 05 ; 03 → 06. Acyclic. Each ticket
merges to `main` via its own squash-merged PR in blocked_by order.

## Findings

**F1 — Per-ticket green-on-main (given blockers merged): HOLDS.** No ticket imports
a not-yet-merged symbol under the stated blocked_by order. Every new module is
dead code (tree-shaken out of `dist/`) until its importer merges, so each build
ticket lands green in isolation.

**F2 — #05 relabel breaks existing label queries: RISK → fixed.** `Toolbar.test.tsx`
and `App.export.test.tsx` query the shipped button by label: exact
`getByRole('button', { name: 'Export' })` (matches nothing after relabel) and
regex `{ name: /Export/ }` (matches BOTH buttons after relabel → throws "multiple
elements"). A naive `s/Export/Export CSV/` is insufficient for the regex cases.
This is a label/query update, NOT a CSV behavior regression. **Fix landed:** #05
now carries a "Test-update scope" section spelling out the `/Export/` ambiguity and
the exact-match narrowing; acceptance wording corrected to "CSV behavior unchanged;
label queries updated".

**F3 — Shared `exportStatus` is a Priority-1 trap: RISK → fixed.** On `main`,
`busy={exportStatus === 'exporting'}` drives the lone Export button and
`exportStatus` is a single tri-state field. The charter §Silence-defaults default
("follow the current single-`exportStatus` shape") cannot satisfy Priority 1: a
single shared field cannot isolate which control is busy, so reusing it verbatim
flashes the shipped CSV button busy during an XLSX export — a regression to a
shipped control. **Fix landed:** #05's Type-2 now explicitly REJECTS the single
shared field and resolves to per-control status; a new acceptance line asserts
clicking "Export XLSX" leaves "Export CSV" without `aria-busy` and vice-versa.

**F4 — #06 blocked_by 03 is correct; no wedge: HOLDS.** The smoke imports only
`serializeXlsx` + `fixtures` + `COLUMNS` (#03) — not `exportXlsx` (#04) or the UI
(#05). #06 may merge before #04/#05 without wedging their PRs, because
`serializeXlsx` is already on `main` and neither later ticket removes it.

**F5 — Reorder freedom is only #06 vs #04; both orders safe: HOLDS.** No earlier
ticket ever rebases onto a `main` carrying a later ticket that removes a symbol it
needs.

**F6 — Bundle ratchet reachable only at #05: RISK → fixed.** DCE keeps
`zip.ts`/`xlsx.ts`/`xlsx-workbook.ts` out of `dist/` until #05 wires
`handleExportXlsx`, so the entire pipeline enters the bundle only at #05. The
216→≤240 headroom is almost certainly enough, but #05 is the single breach point
and its acceptance omitted the check. **Fix landed:** #05 now has
`npm run build` → `du -sk dist/` ≤ 240. The skeptic's further suggestion to add a
`du` gate to `ci.yml` was **declined**: the charter §No-touch bars any `ci.yml`
change beyond the one appended smoke step, so the ratchet stays enforced at the
autopilot INTEGRATE step + #05's acceptance, never CI.

## Outcome
All three RISK findings (F2, F3, F6) were resolved in `docs/auto/tickets/05-xlsx-ui-trigger.md`
and confirmed in the ticket work logs; F1/F4/F5 hold as-is. Independence claims
stand: the tickets are independently mergeable as a DAG.
