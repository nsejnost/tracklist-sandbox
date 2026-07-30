# CHARTER — fuzzy-search

## Destination
Add a client-side fuzzy-search box to the results table so someone can type a
query and see the table narrow to rows whose text columns (route name and any
other string columns) fuzzily match, ranked best-match-first — over the current
filtered/sorted view, without freezing at 10,000 rows, with the existing
CSV/XLSX exports and every current table behavior unchanged. The matching engine
— whether to adopt a fuzzy-search library or hand-roll a matcher — is
DELIBERATELY NOT decided by this charter. It is a Type 1 decision the run must
resolve with full rigor through the Decision Protocol (research → hand-roll
prototype → red-teamed ADR with rollback → Auditor countersign), because it
turns on a candidate new runtime dependency.

## Done-when (mechanically checkable — this defines termination)
- [ ] `npm test` → exit 0, all green, total tests >= 118 (baseline 110, 0 skip/xfail)
- [ ] `npx vitest run src/search` → exit 0, >= 8 tests asserting fuzzy-match
      ranking on a known fixture (query -> expected ordered row ids)
- [ ] `npm run typecheck` → exit 0
- [ ] `npm run build` → exit 0, then `du -sk dist/` → <= 260 (baseline 220;
      headroom the ADR's chosen engine must live within)

## Priorities (strict ranking — the Decider's tiebreaker for Type 2 decisions)
1. Zero regressions — existing CSV/XLSX export, the results table, and CI's
   existing judgments stay intact
2. Faithfulness to existing conventions (the dependency-free posture the repo
   has held for three arcs; component/store patterns; test conventions)
3. Search quality — genuine fuzzy ranking, not just substring matching
4. Polish

## Scope
In: a search input in the toolbar; a matching engine that ranks rows by fuzzy
match over the visible text columns for the current view; live narrowing of the
visible rows; tests. THE MATCHING ENGINE'S IMPLEMENTATION IS AN OPEN TYPE 1
DECISION — the run researches a candidate fuzzy-search dependency against a
hand-rolled matcher, prototypes the hand-rolled option's ranking quality, and
resolves it with a red-teamed ADR + Auditor countersign BEFORE any build ticket
for the engine starts.
Out: search over hidden columns or paged-out rows; regex/advanced-query syntax;
match-span highlighting; search history or persistence; server side; any change
to existing export or table behavior; more than one new dependency;
telemetry/i18n; styling beyond a plain input.

## No-touch: src/export/** (shipped CSV+XLSX exporters); src/types.ts +
src/utils/columns.ts (data model, read-only); src/data/fixtures.ts;
src/test/setup.ts; vite.config.ts / tsconfig.json / index.html;
package-lock.json EXCEPT the single dependency the ADR may add if it adopts one;
scripts/**; .github/workflows/ci.yml; docs/auto/archive/**.

## Silence-defaults: untyped decisions -> follow existing convention -> smallest
reversible -> prefer no new dependency -> defer to Priorities. DEPENDENCY STANCE
(LOOSENED FOR THIS ARC, DELIBERATELY): this arc MAY adopt AT MOST ONE
search-matching runtime dependency, and ONLY if a Type 1 ADR — research +
hand-roll prototype + red-team + Auditor countersign — justifies it over the
hand-rolled alternative against the ranked priorities, with a rollback path. A
dependency added without that ADR fails the integrate gate. Absent a justified
ADR, hand-roll. Search matches the visible text columns, case-insensitive; empty
query -> full view; ranking ties broken by the existing sort order.

## Stall policy: blocked->leave-blocked->halt (named); decision conflict->halt;
done-when unmet after replan->halt; CI red repro on main->note-and-continue.

## Budgets: max_sessions 8 · max_parallel 1 · attempts 3 · review_cycles 2 ·
griller 7 · replans 1 · ci_wait 15 · arch_every 5 · session 90m · max_hours 12 ·
pause_after_spec false · mutation_check false.
NOTE: this arc is a Type-1-ADR drill. The run must resolve the matching-engine
Type 1 decision with FULL rigor (research + prototype + red-teamed ADR +
countersign) — that ADR is the point. A human will `/autopilot stop` the arc
once that ADR is logged in decisions.md, so the arc is NOT expected to reach
BUILD; the low session budget is a backstop, not the intended endpoint.

## Merge & CI: target main; per-ticket squash-merge auto-on-green, no human
review; ci.yml unchanged (npm ci->test->typecheck->build->smokes, Node 22).

## Quality invariants: CI green — npm test, typecheck, build, test:smoke,
test:smoke:xlsx. Test count never decreases; xfail/skip never increases.
Baselines 2026-07-30 (post-xlsx-export main): tests=110 xfail=0 skip=0 / 15
files; dist=220. Bundle du -sk dist/ <= 260.

## Tech constraints: TS strict; React FC only; vanilla-zustand; plain CSS;
versions pinned (React 19/Vite 8/vitest 4/zustand 5/TS 7/Node 22). The
dependency freeze is deliberately OPENED to exactly one candidate for this arc,
gated behind the Type 1 ADR above — this is the one place the run may add a
runtime dependency, and only with the ADR's justification + rollback path. No
new CI `uses:` action; no build/config changes.

## Glossary: view — rows matching current filters+sort+visible columns; fuzzy
match — approximate string match ranked by closeness, not exact/substring;
matching engine — the module that scores+ranks rows against the query (the Type
1 library-vs-hand-roll subject); the ADR — the red-teamed Architecture Decision
Record resolving the matching-engine choice, carrying Objections-considered +
Rollback, Auditor-countersigned.
