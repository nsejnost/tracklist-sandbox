# CHARTER — smoke-gate

<!-- Authored by a human through the /autopilot charter interview on
     2026-07-29 (Renewal of csv-export). Read-only in run mode; amended only
     through the interview (Repair / Renewal). -->

## Destination
This arc succeeds if a change that breaks the full-scale export path can no
longer land on main unnoticed: the existing 10,000-row real-path smoke check
runs automatically as part of the gate that judges every push and pull
request, and a contributor can run the same check locally with a single npm
command. Nothing about the app's runtime behavior changes.

## Done-when (mechanically checkable — this defines termination)
- [ ] `npm run test:smoke` → exit 0, prints `csv:ok rows=10000`
- [ ] `grep -c "test:smoke" .github/workflows/ci.yml` → ≥ 1
- [ ] `grep -c "test:smoke" README.md` → ≥ 1

All three executed at interview time (2026-07-29): each runs and yields a
determinate result; all unmet today, as expected — they define termination,
not entry.

## Priorities (strict ranking — the Decider's tiebreaker for Type 2 decisions)
1. Zero regressions — the app's behavior and the CI gate's existing
   judgments stay intact
2. Faithfulness to existing conventions (workflow style, README tone,
   script patterns)
3. Feature completeness (the gate wired, documented, green)
4. Polish

## Scope
**In (v1 — the whole arc):**
- A `test:smoke` script in `package.json` invoking
  `node scripts/smoke-export.mjs`
- A step in `.github/workflows/ci.yml` running the smoke gate on every push
  and pull request
- The README Commands section updated to document `npm run test:smoke`
- Minimal edits to `scripts/smoke-export.mjs` or
  `scripts/resolve-ts-hook.mjs` only if CI integration strictly requires
  them; each such edit logs a D-entry citing the exact CI behavior that
  forced it

**Out (explicit — an eager agent adds none of these):**
- XLSX export or any new export format (→ icebox, future arc)
- The `ExportStatus` hoist, or any `src/**` change at all — this arc ships
  zero `src/` diffs
- Behavioral rewrites or "improvements" to `scripts/smoke-export.mjs` or
  `scripts/resolve-ts-hook.mjs` beyond the strict CI-integration allowance
- Remodeling CI: new workflow files, job splits, matrix builds, caching
  changes, or action version bumps — the arc adds a step, nothing more
- A CI status badge in the README; README changes beyond the one Commands
  entry
- Lint, format, or git-hook tooling
- New dependencies of any kind, runtime or dev; versions stay pinned
- Telemetry or analytics of any kind
- Refactoring anything; architecture findings go to checkpoint/icebox,
  never into the ticket

## No-touch zones
- `src/**` — the app is frozen this arc (subsumes the previous arc's
  `src/data/fixtures.ts` and `src/test/setup.ts` entries)
- `vite.config.ts`, `tsconfig.json`, `index.html` — build and TS config
- `package-lock.json` — the dependency freeze, made self-enforcing
- `docs/auto/archive/**` — previous arcs' history; a live run never touches it

## Silence-defaults (what the Decider does when this charter is quiet)
Default of defaults, applied in order: (1) follow the existing codebase
convention; (2) pick the smallest reversible option; (3) prefer no new
dependency; (4) still tied → defer to Priorities. Arc-specific rules:
- CI wiring resolves to the smallest diff matching the workflow's existing
  shape: append one `- run: npm run test:smoke` step to the existing job,
  after the existing steps, in their exact style; never reorder, rename, or
  restructure what's there.
- README: replace the raw `node scripts/smoke-export.mjs` line in place
  with the `npm run test:smoke` form (same terse comment style); one line
  total, not two.
- Copy: en-US, terse sentence case matching existing strings.

## Stall policy
- Ticket blocked after max attempts: leave-blocked (→ halt with the
  blocker named)
- Unresolvable decision conflict: halt
- Done-when unmet after replan budget: halt
- CI red that reproduces on main (pre-existing): note-and-continue

## Budgets
- max_sessions: 12
  <!-- appended after HALT 2026-07-29 (Repair interview): raised 2 → 12 per
       halt-report.md open decision 1, human-confirmed. The DELIBERATE
       STARVATION drill below is COMPLETE — its budget HALT fired after MAP
       as designed and was repaired through this interview; the note is
       retained as history and is no longer in force. -->
  DELIBERATE STARVATION — this arc doubles as a repair-path drill: the
  session budget is intentionally starved to force a benign budget HALT
  partway through (expected right after MAP), which will then be repaired
  via the Repair interview and resumed. Preflight must read this as
  deliberate, not a misconfiguration.
- max_parallel: 1
- max_attempts_per_ticket: 3
- max_review_cycles: 2
- max_griller_questions: 7
- replans: 1
- ci_wait_minutes: 15
- arch_checkpoint_every: 5
- max_session_minutes: 90
- max_hours: 24
- pause_after_spec: false
- mutation_check: false

## Merge & CI policy
- target_branch: main
- delivery: per-ticket PRs, squash-merged automatically on green; no human
  review gate
- required repo settings (verified at preflight): squash merge enabled; no
  required human reviews on main; auto-merge enabled if branch protection
  requires status checks
- ci: `.github/workflows/ci.yml` (npm test + typecheck + build, Node 22)
  must pass on every PR; once this arc's ticket merges the smoke step, the
  extended workflow becomes the gate for the arc's own later PRs, including
  the FINISH archive PR

## Quality invariants (ratchets — monotonic for the whole run)
- CI green on every merge — commands, verbatim: `npm test`,
  `npm run typecheck`, `npm run build`
- Test count never decreases; xfail/skip never increases (consolidation
  requires an Auditor-countersigned D-entry)
- Baselines at charter time (recon, 2026-07-29): tests=80 xfail=0 skip=0
  across 13 files
- Bundle ratchet: `npm run build` then `du -sk dist/` → ≤ 216 (the exact
  size at charter time; with `src/**` frozen, any growth is unlawful)

## Tech constraints
- TypeScript strict as configured; `tsconfig.json` is no-touch
- Standing app rules carried from csv-export (React function components
  only; the vanilla-zustand pattern; plain CSS in `src/styles.css`) — moot
  while `src/**` is frozen, kept for reviewer citation stability
- Versions pinned as-is: React 19, Vite 8, vitest 4, zustand 5,
  TypeScript 7, Node 22 in CI — no upgrades, no new dependencies of any
  kind; a new runtime dependency requires a Type 1 ADR
- The CI step is a plain `- run:` line — no new third-party `uses:` actions
  enter the workflow

## Glossary
- **smoke gate** — `npm run test:smoke` ≡ `node scripts/smoke-export.mjs`:
  the 10,000-row real-path export check; success = exit 0 printing
  `csv:ok rows=10000`
- **the gate** — the single CI job in `.github/workflows/ci.yml` that
  judges every push and pull request
- **wiring** — making the smoke gate run automatically (npm script + CI
  step + README line); never changing what the script checks
- **drill** — this arc's deliberate `max_sessions: 2` starvation; its
  budget HALT is expected behavior, to be repaired and resumed, not a
  failure
