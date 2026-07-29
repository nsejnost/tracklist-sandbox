# 01 — Distill codingstandards.md from the existing codebase
type: task
status: merged
blocked_by: -
charter_refs: §Scope-Out(lint tooling — style policed against codingstandards.md in review), §Priorities 2 (faithfulness to conventions)
seams: -
touches: codingstandards.md (new, repo root)
attempts: 1/3
pr: #3
split_generation: 0

## What to build
The repo has no codingstandards.md; reviews police against it, so it must
exist before BUILD. Distill the OBSERVED conventions from the existing source
(src/**) into a short prescriptive document — describe what the code already
does, do not invent policy. Cover at minimum: TS strictness idioms (explicit
interface for props, `type` imports, `as const` unions, readonly arrays);
React function components + named exports; zustand pattern (createStore
factory + typed useStore hook wrapper); CSS conventions (flat class names,
custom properties, no CSS-in-JS); test conventions (vitest + testing-library,
co-located *.test.ts(x), factories from src/test/factories.ts, exact-string
assertions, en-US copy in terse sentence case); JSDoc style (short /** */ on
exported symbols where behavior isn't obvious); file layout (components/,
stores/, utils/, data/). One screen-length is the target; rules must be
checkable by a reviewer.

Merges to main via its own PR (docs-only, CI green trivially).

## Acceptance (executable)
- run: test -f codingstandards.md && wc -l < codingstandards.md   expect: file exists, ≤ ~120 lines
- run: npm test   expect: exit 0, 63 passing (no src changes)
- run: npm run typecheck   expect: exit 0

## Work log
- 2026-07-29T03:12Z session 7d94f2a9: distilled 84-line codingstandards.md
  from observed conventions (TS/React/zustand/CSS/tests/copy-aria/general;
  sources: types, stores, utils, components, ResultsTable.test, factories,
  styles.css). Acceptance in worktree: 84 lines, npm test 63/63, typecheck 0.
  PR #3 opened, CI green (2 check runs), squash-merged 9d21eef. Branch
  deletion skipped (unavailable in-session, cosmetic).
