# CHARTER — csv-export

<!-- Authored by a human through the /autopilot charter interview on
     2026-07-28. Read-only in run mode; amended only through the interview
     (Repair / Renewal). -->

## Destination
This arc succeeds if someone using the results table can take exactly what
they're currently looking at — with their filters, sort order, and chosen
columns applied — out of the app as a file they can open in any spreadsheet
program, including when the result set is large, without the app freezing
while it happens and without anything about how the table works today
changing in the process.

## Done-when (mechanically checkable — this defines termination)
- [ ] `npx vitest run src/export/` → exit 0, ≥ 12 tests passing (dir created by
      the arc; command verified to fail today while the dir is absent)
- [ ] `npm test` → exit 0, all green, total tests ≥ 75 (baseline 63, 0 skipped)
- [ ] `npm run typecheck` → exit 0
- [ ] `npm run build` → exit 0, then `du -sk dist/` → ≤ 230 (baseline 216)
- [ ] `node scripts/smoke-export.mjs` → prints `csv:ok rows=10000` (script
      created by the arc; exports the full seeded fixture set through the real
      export code path)

## Priorities (strict ranking — the Decider's tiebreaker for Type 2 decisions)
1. Zero regressions to the existing table (mergeability)
2. Faithfulness to existing conventions
3. Feature completeness
4. Polish

## Scope
**In (v1 — the confirmed smallest success):**
- CSV export of the current view: all rows matching the active filters, in the
  current sort order, restricted to the currently visible columns; paging ignored
- An export trigger in the table UI
- Chunked/async export with a visible in-progress state; failure surfaces
  inline in the export control's own state (no notification machinery)
- `scripts/smoke-export.mjs`: exports the full seeded fixture set (10,000 rows)
  through the real export code path

**Out (explicit — an eager agent adds none of these):**
- XLSX (→ icebox as a candidate next arc), PDF, or any format beyond CSV
- Any server-side or backend component; the app stays client-only
- Toast/notification system of any kind
- Copy-to-clipboard export variant
- Export-settings UI (filename patterns, delimiter/quoting choosers)
- Keyboard shortcuts
- Telemetry or analytics of any kind
- i18n beyond the existing en-US strings
- Lint, format, or git-hook tooling; style is policed against
  codingstandards.md in review
- Refactoring existing modules beyond what the export seam strictly requires;
  architecture findings go to checkpoint/icebox, never into feature tickets
- Dependency upgrades of any kind
- README/docs expansion, except one line documenting the smoke script in the
  existing Commands section
- Any change to existing table behavior: sorting, filtering, paging, column
  picking, or preferences persistence

## No-touch zones
- `src/data/fixtures.ts` — deterministic seeded fixtures; tests assert exact
  values. Import freely, never modify.
- `src/test/setup.ts` — shared vitest setup. Workers add test files; the
  harness itself is off-limits.
- `.github/workflows/ci.yml` — the CI gate. A run never edits the workflow
  that judges its merges.
- `vite.config.ts`, `tsconfig.json`, `index.html` — build and TS config; the
  arc has no legitimate need to alter them.

## Silence-defaults (what the Decider does when this charter is quiet)
Default of defaults, applied in order: (1) follow the existing codebase
convention; (2) pick the smallest reversible option; (3) prefer no new
dependency; (4) still tied → defer to Priorities. Arc-specific rules:
- Export fidelity: any question the spec doesn't pin resolves to whatever the
  rendered table shows — cell values via the existing per-column format
  functions, headers from the visible column labels (WYSIWYG).
- Persistence: no new persisted state this arc; export state is transient.
  The `tracklist.prefs.v1` schema is frozen; any perceived persistence need
  becomes a decision ticket, and the versioned prefs-store pattern is the
  only lawful shape if one is approved.
- Dependencies: none new of any kind, runtime or dev. package.json and
  package-lock.json change only if a decision ticket approves it (runtime:
  Type 1 ADR). Export tests assert exact expected output strings, never
  round-trips through a second parser.
- Visual: reuse `Button` and `Spinner`; extend `styles.css` via the existing
  custom properties and flat class-name pattern; never invent colors or
  tokens; spacing follows the toolbar's rhythm.
- Copy: terse sentence case matching existing strings (en-US); aria patterns
  as precedented (`aria-busy`, `role="status"`, `aria-live="polite"`).
- Genuinely novel visual/copy territory with nothing to match → Type 2:
  nearest existing pattern, smallest reversible choice.

## Stall policy
- Ticket blocked after max attempts: descope-to-icebox
- Unresolvable decision conflict: halt
- Done-when unmet after replan budget: halt
- CI red that reproduces on main (pre-existing): note-and-continue

## Budgets
- max_sessions: 40
- max_parallel: 2
- max_attempts_per_ticket: 3
- max_review_cycles: 2
- max_griller_questions: 7
- replans: 1
- ci_wait_minutes: 15
- arch_checkpoint_every: 5
- max_session_minutes: 90
- max_hours: 24
- pause_after_spec: true
- mutation_check: false

## Merge & CI policy
- target_branch: main
- delivery: per-ticket PRs, squash-merged automatically on green; no human
  review gate
- required repo settings (verified at preflight): squash merge enabled; no
  required human reviews on main; auto-merge enabled if branch protection
  requires status checks
- ci: `.github/workflows/ci.yml` (npm test + typecheck + build, Node 22) must
  pass on every PR

## Quality invariants (ratchets — monotonic for the whole run)
- CI green on every merge — commands, verbatim: `npm test`,
  `npm run typecheck`, `npm run build`
- Test count never decreases; xfail/skip never increases (consolidation
  requires an Auditor-countersigned D-entry)
- Baselines at charter time (recon, 2026-07-28): tests=63 xfail=0 skip=0
  across 10 files
- Bundle ratchet: `npm run build` then `du -sk dist/` → ≤ 230 (baseline 216)

## Tech constraints
- TypeScript strict as configured; `tsconfig.json` is no-touch
- React function components only
- State: the existing vanilla-zustand pattern — `createStore` factories +
  `useStore` hooks; no new state libraries
- Styling: plain CSS in `src/styles.css` only; no CSS-in-JS, no frameworks
- Versions pinned as-is: React 19, Vite 8, vitest 4, zustand 5, TypeScript 7,
  Node 22 in CI — no upgrades (Scope-Out), no new dependencies of any kind
  (Silence-defaults); a new runtime dependency requires a Type 1 ADR and the
  bundle ratchet applies regardless
- File download via standard Web APIs (Blob / object URL / anchor click),
  consistent with the dependency freeze

## Glossary
- **view** — all rows matching the current filters, in the current sort order,
  restricted to the currently visible columns; independent of paging
- **export** — writing the view to a client-side CSV file download; never a
  server round-trip
- **in-progress state** — the visible busy indication on the export control
  while a chunked export runs (`aria-busy` on the existing Button pattern)
- **large result set** — up to the full 10,000 fixture rows; the chunked
  architecture treats all sizes identically, so no special threshold exists
