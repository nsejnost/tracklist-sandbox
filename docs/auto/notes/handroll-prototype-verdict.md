# Prototype verdict — hand-rolled fuzzy matcher ranking quality

Ticket: #02 (prototype, logic) · arc fuzzy-search · 2026-07-30 (s4, DECIDE) · **throwaway** (harness on
scratch branch `auto/fuzzy-search-proto-02`, never merged, deleted at FINISH). Feeds the #03 Type 1 ADR.

**Design question:** does a dependency-free hand-rolled matcher (subsequence + closeness scoring,
case-insensitive) clear charter **Priority 3** — "genuine fuzzy ranking, not just substring matching"
(§Glossary: "approximate string match ranked by closeness, not exact/substring")?

## Matcher prototyped (throwaway)
Subsequence gate (all query chars must appear in order, case-insensitive) + closeness score =
adjacent-match bonus + start-of-word bonus + earlier-first-match bonus + tighter-span bonus. Ties broken by
existing sort order (row id). Empty query → full view (charter §Silence-defaults). ~40 lines, zero deps.
This is the **fzf / fuzzysort class** of matcher (order-preserving), NOT edit-distance.

## Fixture (id = existing sort order)
```
#1 Morning River Loop   #2 Riverside Run      #3 Mountain Pass Trail  #4 Coastal Ridge Route
#5 Downtown Riverwalk   #6 Forest Ridge Loop  #7 Harbor Bridge Circuit #8 Meadow Creek Path
#9 Sunset Coastal Trail #10 Old Mill Riverbank
```

## Transcripts (hand-roll ranked, best→worst; vs a naive case-insensitive SUBSTRING baseline)
```
QUERY "riv"   fuzzy: #2(49) > #5(37) > #10(37) > #1(27)      substring: #1 #2 #5 #10 (unranked)
QUERY "rvr"   fuzzy: #2(41) > #5(29) > #10(29) > #1(25)      substring: (none)   <-- fuzzy beats substring
QUERY "mtn"   fuzzy: #3(38)                                   substring: (none)   <-- abbreviation
QUERY "cstl"  fuzzy: #4(43) > #9(33)                          substring: (none)   <-- vowel-drop
QUERY "ridge" fuzzy: #4(44) > #6(37) > #7(36)                 substring: #4 #6 #7 (unranked)
QUERY "loop"  fuzzy: #6(36) > #1(35)                          substring: #1 #6 (unranked)
QUERY "xyz"   fuzzy: (none)                                   substring: (none)
```
Reading it:
- **Beyond substring:** `rvr` (r_v_r in "River"), `mtn` ("Mountain"), `cstl` ("Coastal") all match & rank
  under the hand-roll while a pure substring filter returns **nothing** — this is the Priority-3 bar.
- **Genuine ranking:** `riv` puts **#2 Riverside Run** (starts "Riv") above mid-word `Riverwalk`/`Riverbank`
  above `River` buried in a phrase; `ridge` ranks the word-start "Ridge" (#4/#6) above "B**ridge**" (#7).
  Start-of-word + contiguity + position bonuses produce best-match-first, not just a filter.

## 10k-row feasibility (charter §Destination: "without freezing at 10,000 rows")
Single linear scan + O(len) scoring over **10,000** synthetic rows: **avg 4.54 ms per full-scan query**
(20 runs). Well under a 16 ms frame budget → live narrowing on every keystroke stays smooth. No freeze.

## VERDICT
**SUFFICIENT (with one honest bound).** A ~40-line dependency-free subsequence+closeness matcher clears
Priority 3 as the charter defines it: it produces genuine closeness ranking that beats substring
(`rvr`/`mtn`/`cstl`), ranks best-match-first, honors the charter semantics (case-insensitive, empty→full,
ties→existing order), and is trivially fast at 10k rows (4.54 ms).

**Bound the #03 red-team MUST weigh:** this matcher is **order-preserving (subsequence)** — it does NOT
tolerate character **substitutions or transpositions** (e.g. `rivre` transposed, `ridje` mistyped would miss).
Only an **edit-distance** engine (Fuse.js's Bitap) catches those. So "hand-roll clears Priority 3" holds for
the *subsequence* reading of "fuzzy" (which §Glossary supports); if #03 judges that substitution-typo
tolerance is required, that reraises Fuse.js (17.7 KB) vs a heavier hand-rolled Levenshtein (see #01 §3).
This is the exact fork the ADR resolves — evidence, not a decision.

Cross-ref: research note `docs/auto/notes/fuzzy-matching-research.md` (#01). Harness:
`auto/fuzzy-search-proto-02:handroll-fuzzy-proto.mjs` (throwaway).
