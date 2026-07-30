# 03 — Decision: matching engine — adopt a fuzzy-search library vs hand-roll (Type 1 ADR)
type: decision
status: open
blocked_by: 01, 02
charter_refs: §Destination (the Type 1 decision the run must resolve with full rigor: research → hand-roll prototype → red-teamed ADR with rollback → Auditor countersign), §Scope-In (resolve with a red-teamed ADR + Auditor countersign BEFORE any engine build ticket starts), §Silence-defaults (DEPENDENCY STANCE — MAY adopt AT MOST ONE search-matching runtime dep, and ONLY if this ADR justifies it over hand-roll against the ranked priorities with a rollback path; a dep added without the ADR fails the integrate gate; absent a justified ADR, hand-roll), §Priorities (1 zero-regressions > 2 dep-free posture > 3 search quality > 4 polish), §Tech constraints (freeze OPENED to exactly one candidate, gated behind this ADR; bundle ≤260; no build/config changes), §Done-when 4 (dist ceiling the chosen engine must live within), §Glossary (the ADR = red-teamed ADR carrying Objections-considered + Rollback, Auditor-countersigned)
seams: - (decision node; the deliverable is the ADR in decisions.md)
touches: docs/auto/decisions.md (the ADR), docs/auto/tickets/03-decision-matching-engine.md (Work log: Griller/Decider/Red-team transcript)
attempts: 0/3
split_generation: 0

## What to decide (Decision Protocol — Type 1)
Resolve the **matching-engine implementation**: adopt the one candidate fuzzy-search **library** vs **hand-roll** a matcher. Fed by research #01 (the library's real bundle cost vs the 260 ceiling; hand-roll algorithm options) and prototype #02 (hand-roll ranking-quality verdict on a known fixture).

This is **Type 1** (it turns on a candidate NEW runtime dependency — bundle-size + interface + supply-chain impact; not cleanly undoable within one ticket). Run the full protocol per SKILL + playbook §5, in separate subagent contexts:
- **Griller** (sees this ticket + map-so-far + the #01/#02 outputs): ≤ `max_griller_questions` (7) questions, one per exchange, each **carrying the evidence and the option list**; fact-shaped questions bounce to #01, never asked.
- **Decider** (sees ONLY CHARTER.md + decisions.md + the one question): answers from ①ledger ②charter ③silence-defaults; for this Type 1, requires the research + prototype first and chooses the **least-irreversible acceptable** option.
- **Red-team** (separate subagent): argues the strongest case AGAINST the Decider's choice and FOR the runner-up; the Decider answers in the ADR's "Objections considered" or downgrades/defers.
- **Auditor** (fresh context): checks the ADR against charter + ledger before the ticket closes — the **countersign**.

**THIS ADR IS THE ARC'S DRILL TARGET.** Once it is logged in `decisions.md` with the Auditor countersign, a human will `/autopilot stop` the arc (charter NOTE). The arc is not expected to proceed to the engine build (#04) / UI (#05).

## Acceptance (decision ticket — no red-green loop)
- run: `test -f docs/auto/decisions.md`   expect: file exists
- run: `grep -c "ADR" docs/auto/decisions.md`   expect: ≥ 1
- The ADR (D-#### (ADR)) resolves library-vs-hand-roll and carries every required field per formats.md: Context, Evidence (cites the #01 note + #02 verdict), Decision, Charter basis (Priorities/§Silence-defaults §Tech-constraints), **Objections considered** (red-team's strongest case + the answer), **Rollback** (concrete path + cost). Auditor **countersign** recorded (in the ADR or this Work log). Griller/Decider transcript logged verbatim in this ticket's Work log.

## Work log
- 2026-07-30T14:22Z s2 (MAP): node created. type=decision (Type 1). Blocked by #01 (research) + #02 (prototype) — both must close first. This node produces the red-teamed, Auditor-countersigned ADR that is the drill's endpoint; human stops the arc after it lands.
