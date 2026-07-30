# Research — fuzzy-matching engine: candidate library vs hand-rolled matcher

Ticket: #01 (research) · arc fuzzy-search · 2026-07-30 (s3, DECIDE phase) · run in the foreground.
Purpose: pin the facts that decide the #03 Type 1 matching-engine choice (adopt one fuzzy-search
dependency vs hand-roll). **Facts only — the decision is #03's, not this ticket's.**

## 0. Measurement notes (read before using the sizes below)
- Library sizes are bundlephobia's **minified** and **gzip** figures, each pinned to a measured version
  (primary: bundlephobia size API).
- The charter's hard gate is `du -sk dist/` ≤ 260 (baseline 220 → ~40 KB headroom). `du` measures **raw
  on-disk bytes** of the built `dist/`, **not gzip**. The current dist (~220 KB) is dominated by
  raw-minified JS (s1 build report: `207.50 kB` JS raw / `65.89 kB` gzip). **So a dependency's cost against
  the gate is ~its RAW minified size (the bundlephobia "minified" number), not its gzip size.** The §2
  estimates are additive upper bounds; the true delta depends on the app's own minifier/tree-shaking and
  MUST be verified by Done-when 4 at BUILD.

## 1. Candidate libraries (facts from primary sources)

### Fuse.js
- **v7.5.0 · license Apache-2.0 · 0 runtime dependencies · ships TS types** (`dist/fuse.d.ts`).
  [registry.npmjs.org/fuse.js/latest]
- **Size:** minified **17,742 B (~17.3 KB)**, gzip **6,292 B (~6.1 KB)**, 0 deps. [bundlephobia, fuse.js@7.1.0;
  latest 7.5.0 comparable]
- **Ranking model:** a modified **Bitap** algorithm — computes edit distance between the pattern and each
  position in the text via bitwise ops; **32-char pattern limit per search term**. Produces a fuzziness
  score **0 (perfect) → 1 (no match)**, combined with **key weight** and **field-length norm** into the final
  relevance score; `threshold` is the cutoff (0.0 = perfect only, 1.0 = match anything; results scoring above
  threshold are excluded); `location`/`distance` penalize matches far from an expected position. Results are
  sorted ascending by score. [fusejs.io/concepts/scoring-theory.html; fusejs.io/api/options]
- Net: the **most typo-tolerant** of the three (edit-distance → tolerates substitutions/transpositions), but
  the **heaviest**, and the 32-char term limit is a real bound.

### fuzzysort
- **v3.1.0 · license MIT · 0 dependencies · ships TS types** (`index.d.ts`). [registry.npmjs.org/fuzzysort/latest]
- **Size:** minified **7,839 B (~7.7 KB)**, gzip **3,325 B (~3.2 KB)**, 0 deps. [bundlephobia, fuzzysort@3.1.0]
- **Ranking model:** **subsequence** match (all query chars must appear in order); score 0→1 (1 = perfect,
  ~0.5 = good); substring/contiguous matches weighted heavily (v3.0.0 note); **positional bonus** (matches
  near the start score higher); spaced queries handled ("straw berry" matches "strawberry"); **multi-key**
  search via `keys` with combined ranking and a custom `scoreFn`; v3.1.0 auto-handles diacritics/accents.
  [github.com/farzher/fuzzysort README]
- Net: "SublimeText-like" — excellent for prefix/substring/omission typos; **order-preserving** (does not
  tolerate arbitrary character substitutions). Built for speed on large lists.

### uFuzzy (@leeoniya/ufuzzy)
- **v1.0.19 · license MIT · 0 dependencies · ships TS types** (`dist/uFuzzy.d.ts`).
  [registry.npmjs.org/@leeoniya/ufuzzy/latest]
- **Size:** minified **8,511 B (~8.3 KB)**, gzip **3,961 B (~3.9 KB)**, 0 deps. [bundlephobia, @leeoniya/ufuzzy@1.0.18]
- **Ranking model:** MultiInsert (default) = subsequence, all needle chars in sequence (interspersed chars
  allowed, e.g. "cat" → "**c**o**at**"); SingleError = tolerates 1 Damerau–Levenshtein error. Three phases —
  filter (fast regex) → info (stats: start offsets, fuzz level, prefix/suffix counters) → sort (transparent
  `Array.sort` over the stats; no opaque composite score); case-insensitive. [github.com/leeoniya/uFuzzy README]
- **CONSTRAINT (charter-relevant):** the README gates result-quality sorting to **datasets ≤ 1,000 items** for
  performance — a **direct tension with the charter's 10,000-row requirement**. [github.com/leeoniya/uFuzzy README]

## 2. Bundle-headroom analysis (vs `du -sk dist/` ≤ 260; baseline 220 → ~40 KB headroom)
Raw-minified contribution is what counts for `du` (see §0). Additive upper-bound estimates — verify at BUILD.

| Option | raw-min add | est. dist | under 260? | margin |
| --- | --- | --- | --- | --- |
| Fuse.js | ~17.3 KB | ~237 KB | yes | ~23 KB |
| fuzzysort | ~7.7 KB | ~228 KB | yes | ~32 KB |
| uFuzzy | ~8.3 KB | ~228 KB | yes (but ≤1k-item sort) | ~32 KB |
| hand-roll | ~1–3 KB app src | ~221–223 KB | yes | ~37–39 KB |

All library options fit the 40 KB headroom **on paper**; hand-roll is cheapest. Exact deltas depend on the
app's minifier/tree-shaking → confirmed only by Done-when 4 (`npm run build` + `du -sk dist/`).

## 3. Hand-rolled matcher algorithm options (dependency-free)
- **Subsequence + closeness scoring (fzf / fuzzysort model):** require all query chars in order
  (case-insensitive); score by contiguity + start-of-word/position bonuses. Ranking quality: strong for the
  route-name use case (prefix / substring / omitted-char); no arbitrary-substitution tolerance. Cost: ~O(len)
  per row → cheap, a single linear scan over 10,000 rows is trivially feasible (no freeze). ~50–150 lines.
- **Levenshtein / edit distance:** typo-tolerant (substitutions/transpositions/insert/delete); rank by edit
  distance. Cost: O(n·m) DP per candidate → heavier; at 10k rows needs early-exit / banded DP to stay smooth.
  Matches Fuse.js's tolerance at higher cost.
- **Hybrid:** subsequence gate + a small edit-distance or token/prefix bonus — mid cost, good ranking.
- Semantics are charter-fixed either way (§Silence-defaults): visible text columns, case-insensitive; empty
  query → full view; ranking ties broken by the existing sort order.

## 4. Charter-fit summary (facts only — the weighing is #03's job)
- **Priority 1 (zero regressions):** every option isolates into a new `src/search` module; a library adds one
  `package-lock.json` entry (permitted for exactly ONE dep, and ONLY via the #03 ADR) plus supply-chain
  surface; hand-roll adds neither.
- **Priority 2 (dep-free posture, held three arcs):** hand-roll preserves it; ANY library breaks it — lawful
  only with the ADR's justification + rollback path (charter §Silence-defaults DEPENDENCY STANCE).
- **Priority 3 (genuine fuzzy ranking, not substring):** Fuse.js most tolerant (edit-distance);
  fuzzysort / uFuzzy subsequence-based (order-preserving, contiguity-scored); a hand-rolled subsequence+scoring
  equals fuzzysort's model, a hand-rolled Levenshtein equals Fuse.js's tolerance.
- **10k-row feasibility (charter §Destination — no freeze):** Fuse.js and fuzzysort handle it (fuzzysort is
  speed-oriented; Fuse.js is slower on large sets but workable); **uFuzzy's ≤1,000-item sort gate is a red
  flag** for 10k rows; hand-rolled subsequence is trivially feasible.

## Sources (primary)
- registry.npmjs.org/fuse.js/latest · registry.npmjs.org/fuzzysort/latest · registry.npmjs.org/@leeoniya/ufuzzy/latest
- bundlephobia.com/api/size — fuse.js@7.1.0, fuzzysort@3.1.0, @leeoniya/ufuzzy@1.0.18
- fusejs.io/concepts/scoring-theory.html · fusejs.io/api/options
- github.com/farzher/fuzzysort (README) · github.com/leeoniya/uFuzzy (README)
