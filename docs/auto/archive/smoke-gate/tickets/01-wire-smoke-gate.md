# 01 — Wire the smoke gate into npm scripts, CI, and the README
type: build
status: done
blocked_by: -
charter_refs: §Scope In(1-4), §Silence-defaults(CI wiring, README), §Done-when(1-3), §Tech constraints(no new uses: actions), §Quality invariants
spec_refs: R1, R2, R3, R4 (whole-arc guard); US1, US2
seams: package.json "scripts" block; the single ci job's step list in .github/workflows/ci.yml; the README "## Commands" code fence
touches: package.json, .github/workflows/ci.yml, README.md
attempts: 1/3
pr: #10 (merged 2f00358)
split_generation: 0

## What to build
After this ticket, a contributor and CI run the same 10,000-row real-path
export smoke check one way: `npm run test:smoke` (invoking
`node scripts/smoke-export.mjs`) exists as a package script; the existing CI
job runs it as one appended plain `- run:` step after the current steps
(never reordering or restructuring them, no new `uses:` actions); and the
README Commands section documents the npm form by replacing the raw
`node scripts/smoke-export.mjs` line in place (same terse comment style, one
line total). Zero changes under `src/**`; `scripts/smoke-export.mjs` and
`scripts/resolve-ts-hook.mjs` stay untouched unless CI integration strictly
requires a minimal edit — any such edit logs a D-entry citing the exact CI
behavior that forced it (charter §Scope In 4).

All three surfaces land as one slice deliberately: the CI step invokes the
npm script, so merging the step without the script would turn main's gate
red — the slice is atomic to keep main green (spec §Solution).

Worker preconditions and evidence rules (spec §Testing decisions):
- Run `npm ci` before any npm-based acceptance line (mirrors ci.yml's own
  step order).
- Content-adding acceptance lines must be captured RED before the edit
  (missing script / grep count 0 / numstat empty / raw README line present)
  and green after — red output goes in the Work log.
- Two standing guards are green before AND after by design and get no red
  run: R2's `uses:` count = 2 and R3's whole-file smoke-line count = 1.
- The numstat and `tail -1` guards pin exact shape: append/replace only, no
  reformatting, no stray blank lines anywhere in the touched files.
- Drift clause: a numstat/name-only acceptance failure attributable to
  upstream drift (origin/main moved since branch-cut) means rebase onto the
  new tip and rerun — it does not consume an attempt (skeptic finding 4).
- package.json insertion hint: place `test:smoke` where no neighboring-line
  comma edit is needed (e.g. after `"test"`, not as the last entry) so the
  diff stays exactly one added line, honoring spec R1's "No other
  package.json change" (skeptic finding 6).

## Acceptance (executable — copied verbatim from spec.md R1–R4)

R1 — npm script:
- run: npm run test:smoke
  expect: exit 0, prints csv:ok rows=10000
- run: grep -c '"test:smoke": "node scripts/smoke-export.mjs"' package.json
  expect: 1

R2 — CI step:
- run: grep -c "test:smoke" .github/workflows/ci.yml
  expect: ≥ 1
- run: git fetch origin main && git diff --numstat origin/main -- .github/workflows/ci.yml
  expect: exit 0, exactly `1  0  .github/workflows/ci.yml` (tab-separated: one line added, zero removed — mechanically pins "append only": no reorder, no restructure, no stray blank line)
- run: tail -1 .github/workflows/ci.yml
  expect: `      - run: npm run test:smoke` (the appended step is the last line; exact because the numstat guard above excludes any trailing blank line)
- run: grep -c "uses:" .github/workflows/ci.yml
  expect: 2 (standing guard — checkout and setup-node only, green before and after)
- run: grep -c "^      - run:" .github/workflows/ci.yml
  expect: 5 (the four existing run steps plus exactly one)

R3 — README line:
- run: grep -c "test:smoke" README.md
  expect: ≥ 1
- run: grep -Ec "^npm run test:smoke +# real-path CSV export smoke test$" README.md
  expect: 1 (the npm form carries the identical terse comment on one line; internal spacing free so the fence's comment-column convention can be followed)
- run: git fetch origin main && git diff --numstat origin/main -- README.md
  expect: exit 0, exactly `1  1  README.md` (tab-separated: one line added, one removed — the in-place replacement and nothing else, anywhere in the file)
- run: grep -c "node scripts/smoke-export.mjs" README.md
  expect: 0 (replaced, not duplicated)
- run: grep -c "smoke" README.md
  expect: 1 (standing guard — still exactly one smoke line, green before and after)

R4 — invariants (whole-arc guard, checked at integrate):
- run: npm test
  expect: exit 0, ≥ 80 tests passing, 0 skipped
- run: npm run typecheck
  expect: exit 0
- run: npm run build && du -sk dist/
  expect: exit 0, dist ≤ 216
- run: git fetch origin main && git diff --name-only origin/main -- src/ vite.config.ts tsconfig.json index.html package-lock.json
  expect: exit 0, empty output (the fetch precondition keeps this tripwire from passing vacuously on a stale or unresolvable ref)
- run: git fetch origin main && git diff --name-only origin/main -- scripts/
  expect: exit 0, empty output (unless a D-entry cites the forcing CI behavior)

## Work log

### 2026-07-29 — build attempt 1 (worker, worktree wt-t01)

Setup: `npm ci` clean in the worktree (branch auto/smoke-gate-t01 @ b7ea4c3, even with origin/main).

RED (captured before any edit; verbatim results):
- `npm run test:smoke` → exit 1, `npm error Missing script: "test:smoke"`
- `grep -c "test:smoke" .github/workflows/ci.yml` → `0` (exit 1)
- `grep -c "test:smoke" README.md` → `0` (exit 1)
- `git fetch origin main && git diff --numstat origin/main -- .github/workflows/ci.yml README.md` → empty output, exit 0
- `grep -c "node scripts/smoke-export.mjs" README.md` → `1` (raw line present)
- Standing guards, green before as designed (no red run): `grep -c "uses:" .github/workflows/ci.yml` → `2`; `grep -c "smoke" README.md` → `1`

Edits (three lines across three files, nothing else):
- package.json line 11: added `"test:smoke": "node scripts/smoke-export.mjs",` directly after the `"test"` entry (trailing comma, neighbors untouched — diff +1/−0 per the insertion hint)
- .github/workflows/ci.yml line 20: appended `      - run: npm run test:smoke` as the new last line, after `- run: npm run build` (6-space style matched; diff +1/−0, no trailing blank line)
- README.md line 19: replaced the raw smoke line in place with `npm run test:smoke # real-path CSV export smoke test` (single space puts `#` at the fence's aligned comment column 19; diff +1/−1)

GREEN (all 17 acceptance lines run verbatim, in the worktree, after `npm ci`):
- R1.1 `npm run test:smoke` → exit 0, printed `csv:ok rows=10000` — PASS
- R1.2 `grep -c '"test:smoke": "node scripts/smoke-export.mjs"' package.json` → 1 — PASS
- R2.1 `grep -c "test:smoke" .github/workflows/ci.yml` → 1 (≥1) — PASS
- R2.2 fetch + numstat ci.yml → `1	0	.github/workflows/ci.yml` (tab-separated), exit 0 — PASS
- R2.3 `tail -1 .github/workflows/ci.yml` → `      - run: npm run test:smoke` — PASS
- R2.4 `grep -c "uses:"` → 2 — PASS (standing guard, green before and after)
- R2.5 `grep -c "^      - run:"` → 5 — PASS
- R3.1 `grep -c "test:smoke" README.md` → 1 (≥1) — PASS
- R3.2 `grep -Ec "^npm run test:smoke +# real-path CSV export smoke test$" README.md` → 1 — PASS
- R3.3 fetch + numstat README.md → `1	1	README.md` (tab-separated), exit 0 — PASS
- R3.4 `grep -c "node scripts/smoke-export.mjs" README.md` → 0 — PASS (replaced, not duplicated)
- R3.5 `grep -c "smoke" README.md` → 1 — PASS (standing guard, green before and after)
- R4.1 `npm test` → exit 0, 80 passed (80) across 13 files, 0 skipped — PASS
- R4.2 `npm run typecheck` → exit 0 — PASS
- R4.3 `npm run build && du -sk dist/` → exit 0, `216	dist/` (≤216 ratchet held exactly) — PASS
- R4.4 fetch + name-only diff of src/ vite.config.ts tsconfig.json index.html package-lock.json → empty, exit 0 — PASS
- R4.5 fetch + name-only diff of scripts/ → empty, exit 0 — PASS (zero scripts/ edits; no D-entry needed)

Full sweep: tests 80/80 passing, 0 skipped; typecheck clean; bundle 216 KB. No upstream drift (branch stayed even with origin/main across all fetches — drift clause not invoked). No forks, no deviations, no BLOCKED paths.

Commit (local to worktree, not pushed): 81aa30ca21f20dd14f24d1dd8b55b222f68c71e1 — "t01: wire smoke gate into npm scripts, CI, and README" (3 files, +3/−1).
