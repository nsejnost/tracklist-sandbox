# 04 — Build: matching engine module (src/search) per the ADR
type: build
status: open
blocked_by: 03
charter_refs: §Destination (a matching engine that ranks rows best-match-first over the visible text columns for the current view; no freeze at 10,000 rows), §Scope-In (the matching engine — its implementation gated behind the #03 ADR), §Done-when 2 (`npx vitest run src/search` → exit 0, ≥ 8 tests asserting fuzzy-match ranking on a known fixture: query → expected ordered row ids), §Silence-defaults (visible text columns, case-insensitive; empty query → full view; ranking ties broken by existing sort order), §Priorities 1 (zero regressions) & 3 (genuine fuzzy ranking), §No-touch (src/types.ts + src/utils/columns.ts read-only; src/export/**; src/data/fixtures.ts; package-lock.json EXCEPT the single ADR dep)
seams: src/search/ — public entry `rankRows(rows, query, columns)` (or the exact shape the #03 ADR fixes) returning the view's rows ranked best-match-first; the scorer/matcher is internal to the module
touches: src/search/** (new), src/search/*.test.ts (new) [+ package.json & package-lock.json ONLY if the ADR adopts the one runtime dependency]
attempts: 0/3
split_generation: 0

## What to build
The **matching engine** that scores + ranks the current view's rows against a query over the **visible text columns** (route name + any other string columns), case-insensitive; **empty query → full view**; **ranking ties broken by the existing sort order** — implemented per **#03's ADR** (hand-roll, or the one adopted library, whichever the ADR chose, and NOTHING outside it). Must rank 10,000 rows without freezing (charter §Destination). Engine-only: pure/headless module, no toolbar/DOM wiring (that is #05).

The known-fixture ranking tests are the oracle: given a fixture of route-name-like rows and a query, assert the **exact ordered row ids** the engine returns (expected order from an independent worked example / the spec, never recomputed the way the code does — playbook §3 anti-tautology).

> Coarse MAP node. Acceptance is **finalized at TICKETS from the frozen spec.md** (and the engine shape is fixed by #03's ADR). Per the charter NOTE this arc is **not expected to reach BUILD** — the human stops after #03's ADR lands.

## Acceptance (PRELIMINARY — finalized at TICKETS from spec.md; charter Done-when 2)
- run: `npx vitest run src/search`   expect: exit 0, ≥ 8 tests asserting fuzzy-match ranking on the known fixture (query → expected ordered row ids)
- run: `npm run typecheck`   expect: exit 0
- run: `npm test`   expect: exit 0, total ratchets up (toward the arc-end ≥ 118; never decreases)
- run: `npm run build` then `du -sk dist/`   expect: build exit 0, dist ≤ 260 (the ADR's chosen engine lives within this)

## Work log
- 2026-07-30T14:22Z s2 (MAP): node created. type=build. Blocked by #03 — the engine's implementation MUST NOT start before the ADR resolves library-vs-hand-roll (charter §Scope-In). Likely refined/split at TICKETS from spec. Not expected to be reached (drill stops after #03).
