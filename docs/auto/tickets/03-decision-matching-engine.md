# 03 — Decision: matching engine — adopt a fuzzy-search library vs hand-roll (Type 1 ADR)
type: decision
status: merged
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
- 2026-07-30T15:21Z s5 (DECIDE): Type 1 ADR RESOLVED via the full Decision Protocol in SEPARATE subagent contexts (playbook §5). Transcript:
  · GRILLER (saw #03 + map + #01 note + #02 verdict): bounced all fact-questions to #01/#02; surfaced 3 genuine decision forks, each carrying embedded evidence + options — Q1 substitution-tolerance-required vs subsequence-sufficient; Q2 adopt-one-dep vs hand-roll; Q3 which library (Fuse.js / fuzzysort / uFuzzy).
  · DECIDER (fresh; saw ONLY CHARTER.md + empty ledger + the questions): Q1 subsequence sufficient (§Glossary/§Priorities 3 contrast = "not exact/substring"; edit-distance never typed); Q2 hand-roll (§Silence-defaults DEPENDENCY STANCE "absent a justified ADR, hand-roll"; §Priorities 2>3; a library fails to justify over hand-roll on the ranked priorities); Q3 moot. Proposed: hand-roll subsequence matcher, no dep; least-irreversible (eliminates the Type-1 dependency hazard entirely).
  · RED-TEAM (fresh, adversarial): strongest case FOR a library — "approximate" = term of art for error-tolerance ⇒ P3>P2 ⇒ Fuse.js (only edit-distance option); called #02 "grading own homework"; multi-column un-prototyped. Verdict: hand-roll HOLDS but the ADR must WIN the "approximate" semantics ruling from charter text; named Fuse.js runner-up; surfaced repo facts cutting toward hand-roll (12 ASCII route names/no diacritics; codingstandards.md:80 bans new deps; repo already hand-rolled CSV+XLSX writers green).
  · DECIDER (fresh, objections pass): ruled "approximate" from charter text — the typed contrast is substring, not edit-distance; typo-tolerance UNTYPED → §Silence-defaults + DEPENDENCY STANCE govern; the burden is on justifying the dep ("ONLY if justified over hand-roll"), unmet; P3 met so the P3>P2 lever never fires; multi-column contained by the src/search seam. VERDICT: STANDS. Typo-intolerance logged as an accepted, textually-grounded bound; Fuse.js named drop-in runner-up.
  · AUDITOR (fresh countersign): COUNTERSIGN PASS 5/5 — grep-confirmed typo/edit-distance/substitution absent from CHARTER.md + tickets (the UNTYPED premise holds); all charter quotes faithful; objections engaged on both prongs; six required fields present; evidence cites the real #01/#02 notes; no No-touch touched; the no-dep choice trivially satisfies the freeze. No required fixes (one non-blocking precision note folded into the ADR: Fuse.js = only *viable* edit-distance option at 10k rows).
  ADR logged → docs/auto/decisions.md **D-0001 (accepted)**. Acceptance: `test -f decisions.md`✓; `grep -c ADR`=7 (≥1)✓; all six required fields + Auditor countersign present. status→merged. #03 CLOSED. All decision nodes (#01, #02, #03) now closed → DECIDE complete → phase advances to SPEC. **This ADR is the drill's target — the human's /autopilot stop cue.**
