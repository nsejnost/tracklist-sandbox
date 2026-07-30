# 01 — Research: fuzzy-matching approaches — candidate library vs hand-rolled matcher
type: research
status: open
blocked_by: -
charter_refs: §Destination (the Type 1 matching-engine decision this run must resolve), §Scope-In (research a candidate fuzzy-search dependency against a hand-rolled matcher), §Silence-defaults (DEPENDENCY STANCE — at most ONE search-matching dep, only via a justified ADR; absent it, hand-roll), §Priorities (1 zero-regressions, 2 dep-free posture, 3 genuine fuzzy ranking), §Tech constraints (bundle ≤260; pinned versions; no build/config changes), §Done-when 4 (dist ≤260, baseline 220 → 40KB headroom)
seams: - (research; no code)
touches: docs/auto/notes/fuzzy-matching-research.md (new)
attempts: 0/3
split_generation: 0

## What to find (facts from primary sources — found, never decided)
De-risk the Type 1 matching-engine decision (#03) by pinning, from primary sources, the facts that decide library-vs-hand-roll. Produce `docs/auto/notes/fuzzy-matching-research.md`, each claim cited to its owning source (npm registry / unpkg / bundlephobia-equivalent measured, official docs, the library's own source/README, MDN for any Web API):

1. **Candidate fuzzy-search library/libraries** (survey the realistic options — e.g. Fuse.js, fuzzysort, uFuzzy — pick the strongest 1–2 to profile in depth): exact **minified+gzipped bundle size**, **transitive dependency count** (zero-dep or not), **license**, latest **version + maintenance** status, whether it ships **TypeScript types**, tree-shakeability, and its **ranking model** (how it scores/orders matches) in enough detail that #02's hand-roll can be measured against it.
2. **Bundle-headroom analysis**: the arc's dist ceiling is **260 KB** (baseline **220**) → ~40 KB headroom. State each candidate's cost against that headroom (does it fit? with what margin?). This is the hard constraint the ADR's chosen engine must live within.
3. **Hand-rolled matcher algorithm options**: the realistic dependency-free approaches (subsequence match + positional/closeness scoring; edit-distance / Levenshtein; token & prefix bonuses), each with a one-line note on ranking quality vs cost, and feasibility of ranking 10,000 rows without freezing (charter §Destination).
4. **Charter-fit summary**: for each option (library, hand-roll), a neutral facts-only line on how it sits against Priorities 1 (regressions/CI), 2 (dep-free posture held three arcs), 3 (search quality). Facts only — the *decision* is #03's, not this ticket's.

## Acceptance (research ticket — no red-green loop; runs in the FOREGROUND per rails)
- run: `test -f docs/auto/notes/fuzzy-matching-research.md`   expect: file exists
- run: `grep -ci "gzip" docs/auto/notes/fuzzy-matching-research.md`   expect: ≥ 1 (bundle-size cost documented)
- Manual gate (Auditor at DECIDE close): every claim cites a primary source; the note is sufficient to feed the #03 decision (library option's real bundle cost vs the 260 ceiling; hand-roll's algorithm + ranking-quality profile) without further external lookup.

## Work log
- 2026-07-30T14:22Z s2 (MAP): node created. type=research; no blockers; runs in the FOREGROUND during DECIDE (rails: research is never a background agent). Feeds the #03 Type 1 ADR alongside prototype #02.
