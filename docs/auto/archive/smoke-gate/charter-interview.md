# Charter interview — smoke-gate — 2026-07-29 — mode: RENEWAL

Renewal of csv-export. Precondition check: the finished arc's docs/auto
contents were already archived to docs/auto/archive/csv-export/ and merged to
main (PR #7) — no move needed. Question budget ~15; 13 substantive questions
asked. Stable sections carried as labelled proposals; Destination, Done-when,
Scope interviewed fresh.

## Recon (Phase 0, read-only + one baseline run)
P1: baselines run 2026-07-29 — `npm test` 80/80 passing, 13 files, 0 skipped;
  `npm run typecheck` exit 0; `npm run build` exit 0 + `du -sk dist/` = 216;
  `node scripts/smoke-export.mjs` prints `csv:ok rows=10000` → shown, used as
  charter baselines [FACT-CONFIRMED via Q3/Q11 adoption]
P2: csv-export icebox reviewed — 4 entries: XLSX (charter-named candidate),
  smoke-in-CI wiring (Strong), ExportStatus hoist (Worth exploring),
  buildCsvSync comment-only rule (informational) → presented as arc
  candidates in Q1 [FACT-CONFIRMED]
P3: `scripts/smoke-export.mjs` read — self-contained under plain Node
  (registers resolve hook itself; exit 0 `csv:ok rows=10000` / exit 1
  `csv:fail …`) → shown before Q2 [FACT-CONFIRMED]

## Arc focus
Q1: What should this arc be about?
  options: A XLSX + hardening (Recommended) | B XLSX export only |
           C Hardening only
A1: [TYPED] Smoke-in-CI wiring only — keep this arc to the single CI ticket;
  XLSX and ExportStatus hygiene stay iceboxed for a future arc. Arc doubles
  as a deliberate repair-path drill: session budget intentionally starved
  (max_sessions: 2) to force a benign budget HALT partway through, then
  repair and resume; note that intent in Budgets so preflight reads it as
  deliberate.
=> charter lines written: Scope-In seed (wiring only); Scope-Out icebox
   carries (XLSX, ExportStatus); Budgets max_sessions: 2 + drill note.

## Destination
Q2: Which Destination paragraph (arc slug smoke-gate unless overridden)?
  options: A Guarantee-shaped (Recommended) | B Wiring-shaped |
           C A-with-edits
A2: A [CLICKED] (first send interrupted before delivery; re-presented
  unchanged)
=> charter lines written: §Destination full paragraph; arc slug smoke-gate
   accepted [DEFAULT-ACCEPTED].

## Done-when
P4: candidate commands executed live — `npm run test:smoke` → exit 1
  (Missing script); `grep -c "test:smoke" .github/workflows/ci.yml` → 0,
  exit 1; `grep -c "test:smoke" README.md` → 0, exit 1; suite/typecheck/
  build/216 from P1 [FACT-CONFIRMED]
Q3: Which Done-when list?
  options: A All 6, pin bundle 216 (Recommended) | B All 6, keep ≤ 230 |
           C Arc-specific only (lines 1–3)
A3: C [CLICKED]
=> charter lines written: the three §Done-when lines; suite/typecheck/build
   enforcement delegated to §Quality invariants.

## Scope
Q4: Which Scope-In list?
  options: A Three items, script frozen (Recommended) |
           B Three + strict script-edit allowance
A4: B [CLICKED]
=> charter lines written: §Scope In items 1–4 (allowance initially
   smoke-export.mjs only; extended to the resolve hook by A6).

Q5: Which Scope-Out list? (adversarial pass; additions invited)
  options: A Adopt as drafted (Recommended) | B Adopt minus named lines
A5: A [CLICKED]
=> charter lines written: §Scope Out, all nine bans including zero src/
   diffs, no CI remodel, no README badge, D-entry duty on script edits.

## No-touch zones
Q6: Which paths are no-touch? [multi-select; stated rule: unselected hook →
  falls under the script allowance instead]
  options: src/** entirely | build/TS config trio (vite.config.ts,
           tsconfig.json, index.html) | lockfile + archive
           (package-lock.json, docs/auto/archive/**) | resolve-ts-hook.mjs
A6: src/** + config trio + lockfile/archive [CLICKED]; hook not selected →
  allowance extended to scripts/resolve-ts-hook.mjs per the stated rule
=> charter lines written: §No-touch (four zones); §Scope In item 4 covers
   both scripts. ci.yml removed from last arc's list (the arc edits it);
   smoke script deliberately not listed (allowance requires a legal diff).

## Priorities
Q7: Which ranking for Type 2 tiebreaks?
  options: A Carry csv-export ranking, adapted (Recommended) |
           B Completeness above conventions
A7: A [CLICKED]
=> charter lines written: §Priorities 1–4 (zero regressions > conventions >
   completeness > polish).

## Silence-defaults
Q8: Which rules? (dilemmas pre-answered: CI step shape; README line)
  options: A As drafted — append one step, replace README line in place
           (Recommended) | B Same but keep both README lines
A8: A [CLICKED]
=> charter lines written: §Silence-defaults — carried default-of-defaults +
   append-one-step rule + replace-in-place README rule + carried copy rule.

## Stall policy
Q9: Which stall policy?
  options: A Leave-blocked on blocked ticket, rest carried (Recommended) |
           B Carry verbatim (descope-to-icebox)
A9: A [CLICKED]
=> charter lines written: §Stall policy (leave-blocked / halt / halt /
   note-and-continue).

## Budgets
Q10: Which Budgets block? (halt-landing mechanics explained: session 1
  VALIDATE, session 2 MAP, session-3 wake → budget HALT)
  options: A max_sessions 2, pause_after_spec false (Recommended) |
           B 2 with spec pause carried | C 4, no spec pause
A10: A [CLICKED]
=> charter lines written: §Budgets — max_sessions: 2 with DELIBERATE
   STARVATION note; max_parallel: 1 (adapted, one ticket); rest carried;
   pause_after_spec: false (changed from csv-export's true).

## Merge & CI + Quality invariants
Q11: Adopt both sections; bundle ceiling?
  options: A Adopt, tighten to ≤ 216 (Recommended) | B Adopt, keep ≤ 230
A11: A [CLICKED]
=> charter lines written: §Merge & CI (carried + extended-workflow note);
   §Quality invariants (baselines tests=80 xfail=0 skip=0, 13 files;
   bundle ratchet ≤ 216).

## Tech constraints + Glossary
Q12: Adopt both as drafted?
  options: A Adopt both (Recommended) | B Adopt with edits
A12: A [CLICKED]
=> charter lines written: §Tech constraints (carried + no new third-party
   `uses:` actions); §Glossary (smoke gate, the gate, wiring, drill).

## Standing-policy close (Renewal closing question)
Q13: Any standing policy that should change this arc?
  options: No — policies stand (Recommended) | Yes — changes
A13: No [CLICKED]
=> no further charter changes.

## Full read-back
C1: human required the complete CHARTER.md printed verbatim in chat before
  confirming (two delivery attempts had not reached them) → full document
  printed as a standalone message; human acknowledged reading it
  [CLARIFICATION]
Q14 (confirmation, not counted against budget): Confirm the charter exactly
  as printed?
  options: Confirm — write it | Edit first
A14: Confirm — write it [CLICKED]
Confirmed by human: 2026-07-29T16:09Z

# Charter interview — smoke-gate — 2026-07-29 — mode: REPAIR
## Budgets (repair after HALT 2026-07-29)
Q1: Raise max_sessions to what? Remaining work is ≈5 sessions (DECIDE close
  → SPEC → TICKETS → BUILD wave for #01 → FINISH). Recommended: 12 total
  (2 spent + ≈5 needed + margin). [asked verbatim from halt-report.md open
  decision 1]
  options: A 12 total (Recommended) | B 8 total | C 20 total
A1: A [CLICKED]
=> charter lines written: §Budgets max_sessions: 12 under dated
   <!-- appended after HALT 2026-07-29 --> comment; drill note retained as
   history, marked complete.
## Full read-back
Confirmed by human: 2026-07-29T18:34Z
