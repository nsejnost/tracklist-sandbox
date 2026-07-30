# 02 — Prototype: hand-rolled fuzzy matcher — ranking quality on a known fixture
type: prototype
status: open
blocked_by: -
charter_refs: §Destination (hand-roll prototype is a named step of the Decision Protocol), §Scope-In (prototypes the hand-rolled option's ranking quality), §Priorities 3 (genuine fuzzy ranking, not just substring matching), §Glossary (fuzzy match = approximate match ranked by closeness, not exact/substring), §Silence-defaults (matches visible text columns, case-insensitive; empty query → full view; ties → existing sort order)
seams: - (throwaway prototype; scratch branch auto/fuzzy-search-proto-02; NEVER merged; deleted at FINISH)
touches: docs/auto/notes/handroll-prototype-verdict.md (new) [+ throwaway scratch harness on the proto branch, not merged]
attempts: 0/3
split_generation: 0

## What to prototype (logic prototype — test-free, per playbook §8)
Answer the design question the #03 ADR turns on: **does a dependency-free hand-rolled matcher clear the charter's Priority-3 "genuine fuzzy ranking" bar?** Build a small throwaway harness that runs a hand-rolled fuzzy matcher (subsequence + closeness scoring, case-insensitive) over a **known fixture** of route-name-like strings, feed it several queries — including typo/transposition/partial cases that a pure substring filter would fail — and **print the full ranked output (query → ordered ids/labels) after each**. The transcript is the artifact.

This is a **logic** prototype (the charter did NOT opt into UI prototypes and preflight confirmed none needed): no browser, no tests, no polish, no persistence. The **verdict** — hand-roll ranking quality *sufficient* vs *insufficient* against Priority 3, and a note on 10k-row feasibility — is what survives and is cited by #03 as ADR evidence. Match existing conventions, do not invent scope.

## Acceptance (prototype ticket — test-free, per playbook §8)
- run: `test -f docs/auto/notes/handroll-prototype-verdict.md`   expect: file exists
- The verdict note records: the fixture, the queries run, the ranked transcripts, and a clear one-line **verdict** (hand-roll ranking quality sufficient / insufficient vs charter Priority 3) plus a 10k-row feasibility note — enough for #03's Decider/Red-team to weigh hand-roll against the library.
- Scratch harness committed to `auto/fuzzy-search-proto-02` only; never merged to main; deleted at FINISH (rails: prototype code never merges).

## Work log
- 2026-07-30T14:22Z s2 (MAP): node created. type=prototype (logic). No blockers; feeds the #03 Type 1 ADR alongside research #01. Runs in the foreground; verdict-only artifact to notes/, throwaway code to a proto scratch branch.
