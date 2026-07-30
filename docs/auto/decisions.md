# Decisions — fuzzy-search

Append-only ledger of D-#### entries and ADRs for the fuzzy-search arc.

## D-0001 (ADR) — Matching engine: hand-rolled subsequence matcher, no runtime dependency
Ticket: #03   Date: 2026-07-30   Status: accepted

Context: The fuzzy-search matching engine's implementation was DELIBERATELY left open by the charter as a Type 1 decision — adopt at most one fuzzy-search runtime dependency vs hand-roll — because it turns on a candidate new runtime dependency (bundle size, public interface, supply-chain surface; not cleanly reversible within one ticket). Resolved via the full Decision Protocol in separate subagent contexts: research (#01) → hand-roll prototype (#02) → Griller → Decider → Red-team → this ADR + Auditor countersign, BEFORE any engine build ticket (#04) starts (charter §Scope-In).

Evidence:
- research: docs/auto/notes/fuzzy-matching-research.md (#01) — Fuse.js / fuzzysort / uFuzzy profiled from primary sources (sizes, licenses, ranking models, TS types); bundle-headroom analysis vs the 260 KB dist ceiling.
- prototype: docs/auto/notes/handroll-prototype-verdict.md (#02) — a ~40-line dependency-free subsequence+closeness matcher, verdict SUFFICIENT vs Priority 3 on a known fixture (matches & ranks rvr/mtn/cstl that a substring filter misses; best-match-first); 4.54 ms/full-scan over 10,000 rows (no freeze).

Decision: Hand-roll the matching engine as a new isolated `src/search` module using a **subsequence + closeness** matcher (order-preserving match; positional / contiguity / start-of-word closeness scoring; ranked best-match-first). **Adopt NO runtime search dependency.** The engine matches the visible text columns case-insensitively; empty query → full view; ranking ties broken by the existing sort order (charter §Silence-defaults). The single dependency the charter conditionally allowed for this arc is deliberately NOT spent — the justification to spend it does not clear the charter's bar (below).

Charter basis (in priority order):
1. §Silence-defaults DEPENDENCY STANCE (controlling): a library is lawful "ONLY if a Type 1 ADR … justifies it over the hand-rolled alternative against the ranked priorities, with a rollback path … Absent a justified ADR, hand-roll." The justification fails → the default fires.
2. §Priorities 2 > 3: P2 "the dependency-free posture the repo has held for three arcs" favors hand-roll; P3 "genuine fuzzy ranking, not just substring matching" is MET by the proven prototype — no priority selects a library over hand-roll.
3. §Silence-defaults: "smallest reversible → prefer no new dependency."
4. §Glossary: "approximate string match ranked by closeness, not exact/substring" — the charter's contrast class is *substring*, not edit-distance; subsequence+closeness clears it.
5. §Destination / §Done-when: "without freezing at 10,000 rows" met (4.54 ms); hand-roll dist ~221–223 KB, ~37–39 KB under the 260 KB ceiling.
6. Reinforcing (repo-level): codingstandards.md "No new dependencies, runtime or dev" — the charter opened this to exactly one candidate for this arc, gated behind this ADR; the gate does not open.

Objections considered (Red-team, fresh context — strongest case for a library, each answered):
- "Approximate ⇒ edit-distance." Red-team: "approximate" is the term of art for error-tolerant matching, so P3 (search quality) > P2 (dep-free) forces the only edit-distance option, Fuse.js. Answer: the charter's typed contrast is "not exact/substring" (Glossary) / "not just substring matching" (Priority 3); the words typo / edit-distance / substitution / transposition appear NOWHERE in the charter (grep-confirmed by the Auditor) — only in the evidence. Subsequence+closeness IS "approximate … ranked by closeness" and provably beats substring (#02). Whether "approximate" further demands substitution tolerance is UNTYPED → §Silence-defaults + the DEPENDENCY STANCE govern, and the stance places the burden on justifying the dependency over hand-roll, which fails. (Note: even under the adversarial reading, research §3 offers a dependency-free banded-Levenshtein, so an edit-distance requirement would still not *compel* a dependency.)
- "P3 > P2 forces the library." The lever never fires because its premise (P3 unmet) is false: P3's bar "not just substring" is met and proven by #02.
- "Multi-column ranking is un-prototyped." True that #02 exercised single-column route names, but a library needs the identical per-column key-weighting integration, so it discriminates nothing; the work is contained by the isolated `src/search` seam and verified by Done-when 2 (≥ 8 ranking tests, query → expected ordered row ids).
- Runner-up on record: **Fuse.js v7.5.0** (Apache-2.0, 0 runtime deps, ~17.3 KB raw-min, ~23 KB under the ceiling) — the only *viable* edit-distance option at 10k rows (uFuzzy's SingleError mode also does bounded edit-distance but is disqualified by its ≤ 1,000-item quality-sort gate). Declined because adopting it trades the higher-ranked P2 and a PROVEN no-freeze (4.54 ms) for Fuse.js's UNMEASURED 10k performance, to buy a capability the charter never typed as required.

Rollback: the matcher lives entirely inside `src/search/**` and adds NO package-lock.json entry and NO supply-chain surface. If subsequence proves insufficient in practice (a real need for substitution / transposition-typo tolerance emerges), undo = edit or delete the single `src/search` module + its tests (zero lock-file surgery; nothing to unwind from the dependency graph), then either (a) extend the module with a dependency-free banded-Levenshtein pass (research §3), or (b) re-open this Type 1 ADR to adopt at most one library under the same gate. Because the engine sits behind a stable module interface, the named runner-up Fuse.js is a drop-in behind that seam. Cost: one isolated app-module rewrite + its src/search tests; no CI/config/build change; no export/table impact (No-touch paths untouched).

Accepted bound: the chosen matcher is order-preserving (subsequence) and does NOT tolerate substitution / transposition typos (`rivre` / `ridje` → no match). This is a deliberate, textually-grounded bound at the edge of the charter's typed definition of fuzzy — which subsequence+closeness satisfies in full — not an oversight.

Supersedes: —

Auditor countersign (2026-07-30, fresh context): D-0001 verified charter-faithful against CHARTER.md and the empty ledger — all charter quotes accurate; the DEPENDENCY-STANCE default ("absent a justified ADR, hand-roll") correctly fires; "approximate = not exact/substring" is the charter's own typed contrast and typo-tolerance is genuinely UNTYPED (confirmed absent from charter and tickets by search); objections engage the P3>P2 / "approximate ⇒ edit-distance" case on both prongs; all six required fields present, evidence cites the real #01/#02 notes, rollback concrete; no No-touch zone touched and the no-dependency choice trivially satisfies the freeze. PASS.
