# Spec — smoke-gate

Synthesized 2026-07-29 (s04) from the closed map (sole node: ticket #01),
an empty decision ledger (no decisions.md — zero D-entries), and the
charter; revised same-session after the red-team pass. Frozen after the
SPEC gate.

## Problem

The 10,000-row real-path export smoke check exists
(`scripts/smoke-export.mjs`) but nothing runs it automatically: a change
that breaks the full-scale export path can land on main unnoticed, and
contributors must know the raw `node scripts/…` invocation to run it at
all. (Charter §Destination.)

## Solution

Wire the existing check into the three surfaces that make it unmissable —
an npm script, the existing CI job, and the README — changing nothing about
what the check itself does and nothing under `src/**`. One build ticket
(#01) delivers all three surfaces as a single vertical slice.

## User stories

- **US1 — CI blocks silent breakage.** As the CI gate, every push and pull
  request runs the smoke check, so a change that breaks the full-scale
  export path fails the gate. (Charter §Destination, §Scope In 2,
  §Done-when 2.)
- **US2 — contributors run the same check one way.** As a contributor, I
  run `npm run test:smoke` locally — the identical check CI runs — and the
  README Commands section tells me so. (Charter §Scope In 1+3,
  §Done-when 1+3.)

## Requirements

### R1 — npm script `test:smoke`
`package.json` gains exactly one script entry:
`"test:smoke": "node scripts/smoke-export.mjs"` in the existing `scripts`
block. No other package.json change. (Charter §Scope In 1; §Done-when 1.)

Acceptance (executable):
- run: `npm run test:smoke` → expect: exit 0, prints `csv:ok rows=10000`
- run: `grep -c '"test:smoke": "node scripts/smoke-export.mjs"' package.json` → expect: `1`

### R2 — CI step appended to the existing job
`.github/workflows/ci.yml` gains exactly one step,
`- run: npm run test:smoke`, appended after the existing steps of the
single `ci` job, in the existing steps' exact style. Nothing is reordered,
renamed, restructured, or version-bumped; no new `uses:` action enters the
workflow. (Charter §Scope In 2; §Silence-defaults CI wiring;
§Done-when 2; §Tech constraints.)

Acceptance (executable):
- run: `grep -c "test:smoke" .github/workflows/ci.yml` → expect: `≥ 1`
- run: `git fetch origin main && git diff --numstat origin/main -- .github/workflows/ci.yml` → expect: exit 0, exactly `1  0  .github/workflows/ci.yml` (tab-separated: one line added, zero removed — mechanically pins "append only": no reorder, no restructure, no stray blank line)
- run: `tail -1 .github/workflows/ci.yml` → expect: `      - run: npm run test:smoke` (the appended step is the last line; exact because the numstat guard above excludes any trailing blank line)
- run: `grep -c "uses:" .github/workflows/ci.yml` → expect: `2` (standing guard — checkout and setup-node only, green before and after)
- run: `grep -c "^      - run:" .github/workflows/ci.yml` → expect: `5` (the four existing run steps plus exactly one)

### R3 — README Commands line replaced in place
In the README `## Commands` code fence, the raw
`node scripts/smoke-export.mjs  # real-path CSV export smoke test` line is
replaced in place (same position, last line of the fence) by the npm form
with the same terse comment style — one line total, not two. (Charter
§Scope In 3; §Silence-defaults README; §Done-when 3.)

Acceptance (executable):
- run: `grep -c "test:smoke" README.md` → expect: `≥ 1`
- run: `grep -Ec "^npm run test:smoke +# real-path CSV export smoke test$" README.md` → expect: `1` (the npm form carries the identical terse comment on one line; internal spacing free so the fence's comment-column convention can be followed)
- run: `git fetch origin main && git diff --numstat origin/main -- README.md` → expect: exit 0, exactly `1  1  README.md` (tab-separated: one line added, one removed — the in-place replacement and nothing else, anywhere in the file)
- run: `grep -c "node scripts/smoke-export.mjs" README.md` → expect: `0` (replaced, not duplicated)
- run: `grep -c "smoke" README.md` → expect: `1` (standing guard — still exactly one smoke line, green before and after)

### R4 — invariants hold (whole-arc guard, checked at integrate)
Zero diffs in no-touch zones; the existing suite, typecheck, build, and
bundle ratchet unchanged. `scripts/smoke-export.mjs` and
`scripts/resolve-ts-hook.mjs` are expected to need **zero** edits (the
smoke script already runs green locally — VALIDATE baseline "smoke ok");
any strictly-CI-forced minimal edit requires a D-entry citing the exact CI
behavior that forced it (charter §Scope In 4). (Charter §No-touch,
§Quality invariants.)

Acceptance (executable):
- run: `npm test` → expect: exit 0, ≥ 80 tests passing, 0 skipped
- run: `npm run typecheck` → expect: exit 0
- run: `npm run build && du -sk dist/` → expect: exit 0, `dist ≤ 216`
- run: `git fetch origin main && git diff --name-only origin/main -- src/ vite.config.ts tsconfig.json index.html package-lock.json` → expect: exit 0, empty output (the fetch precondition keeps this tripwire from passing vacuously on a stale or unresolvable ref)
- run: `git fetch origin main && git diff --name-only origin/main -- scripts/` → expect: exit 0, empty output (unless a D-entry cites the forcing CI behavior)

## Seams (TDD boundaries — all existing, none new)

- **package.json `scripts` block** — behavior observed through `npm run`
  (R1) and the file's literal content (grep).
- **The single `ci` job's step list** in `.github/workflows/ci.yml` —
  observed through the file's structure (grep/tail); CI's own green run on
  the PR is the end-to-end observation.
- **The README `## Commands` code fence** — observed through grep.

The red→green shape for this wiring ticket: every content-adding
acceptance command runs red before the edit (missing script / grep count
0 / numstat empty / raw line present) and green after, with the red
evidence logged in the ticket's Work log per the worker loop. The two
standing invariant guards — R2's `uses:` count = 2 and R3's single-smoke-
line count = 1 — are green before and after by design; they hold
throughout and get no red run.

## Implementation decisions

The ledger is empty — every choice below is pinned by the charter, cited:
- Script name and body: `test:smoke` → `node scripts/smoke-export.mjs`
  (§Scope In 1).
- CI wiring shape: smallest diff matching the workflow's existing shape —
  append one `- run:` step after the existing steps, never reorder or
  restructure (§Silence-defaults CI wiring).
- README: replace the raw line in place, npm form, same terse comment,
  one line total (§Silence-defaults README).
- No new dependencies, no version changes, no new `uses:` actions
  (§Tech constraints).

## Testing decisions

- This arc adds **no vitest tests**: the deliverable is wiring, and the
  smoke script itself is the test being wired. Verification is the
  executable acceptance set above (the wiring's observable behavior at its
  three seams) plus CI green on the PR.
- Test-count ratchet: the suite stays at ≥ 80 passing / 0 skipped — no
  test file is added or removed (§Quality invariants).
- Red-run evidence: content-adding acceptance commands captured failing
  before the edits, in the Work log (worker loop step 1, adapted to config
  seams); standing guards are exempt as above.
- Environment precondition: all npm-based acceptance lines assume
  dependencies are installed in the executing container — run `npm ci`
  first, mirroring ci.yml's own step order.

## Out of scope (charter §Scope Out, verbatim + icebox to date)

- XLSX export or any new export format (icebox: carried 2026-07-29).
- The `ExportStatus` hoist, or any `src/**` change at all — zero `src/`
  diffs this arc (icebox: carried 2026-07-29).
- Behavioral rewrites or "improvements" to `scripts/smoke-export.mjs` or
  `scripts/resolve-ts-hook.mjs` beyond the strict CI-integration
  allowance.
- Remodeling CI: new workflow files, job splits, matrix builds, caching
  changes, or action version bumps.
- A CI status badge in the README; README changes beyond the one Commands
  entry.
- Lint, format, or git-hook tooling.
- New dependencies of any kind, runtime or dev; versions stay pinned.
- Telemetry or analytics of any kind.
- Refactoring anything; architecture findings go to checkpoint/icebox,
  never into the ticket.
