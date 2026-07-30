# 01 — Research: fuzzy-matching approaches — candidate library vs hand-rolled matcher
type: research
status: merged
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
- 2026-07-30T14:44Z s3 (DECIDE): research DONE (foreground) → docs/auto/notes/fuzzy-matching-research.md. Primary sources: npm registry API (fuse.js 7.5.0 Apache-2.0 / fuzzysort 3.1.0 MIT / @leeoniya/ufuzzy 1.0.19 MIT — all 0-dep, all ship TS types); bundlephobia size API (Fuse.js min 17.7KB/gzip 6.1KB · fuzzysort min 7.7KB/gzip 3.2KB · uFuzzy min 8.3KB/gzip 3.9KB); fusejs.io scoring-theory (modified Bitap, score 0→1, 32-char term limit, weight+field-norm, threshold cutoff); fuzzysort + uFuzzy READMEs (subsequence models + bonuses). Key findings for #03: all 3 libs fit the ~40KB du headroom ON PAPER (raw-min adds ~17.3/7.7/8.3KB → est dist 237/228/228 ≤260), hand-roll adds ~1-3KB; uFuzzy README gates quality-sort to ≤1000 items (RED FLAG vs charter's 10k rows); Fuse.js most typo-tolerant (edit-distance) but heaviest, fuzzysort/uFuzzy order-preserving (subsequence); a hand-rolled subsequence+scoring ≍ fuzzysort's model, hand-rolled Levenshtein ≍ Fuse's tolerance. Acceptance: `test -f`✓; `grep -ci gzip`=7 (≥1)✓; the third acceptance (Auditor manual "every claim cites a primary source" gate) is deferred to DECIDE close (#03's Auditor). Foreground; no code merged. status→merged (node closed; the note is a coordination-branch artifact, nothing goes to main).
