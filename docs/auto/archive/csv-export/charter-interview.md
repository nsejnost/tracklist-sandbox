# Charter interview — csv-export — 2026-07-28 — mode: NEW

Recon (read-only + one baseline test run): repo = Vite + React 19 + TS strict +
zustand 5 + vitest 4; results table over 10,000 seeded deterministic sessions.
Baselines measured: `npm test` 63 passing / 10 files / 0 skip; `npm run
typecheck` exit 0; `npm run build` exit 0, `du -sk dist/` = 216; CI =
`.github/workflows/ci.yml` (test + typecheck + build, Node 22); no lint/format
tooling; no e2e. `npx vitest run src/export/` verified exit 1 today (no dir).

## Destination
Q1: "Finish this sentence: this arc succeeds if ___." (free text)
A1: [TYPED] "This arc succeeds if someone using the results table can take
    exactly what they're currently looking at — with their filters, sort
    order, and chosen columns applied — out of the app as a file they can
    open in any spreadsheet program, including when the result set is large,
    without the app freezing while it happens and without anything about how
    the table works today changing in the process."
Q2: Which text goes in the Destination section?
  options: A verbatim (Recommended) | B tightened rewrite
A2: A [CLICKED]
=> charter lines written: §Destination, verbatim A1.

## Done-when
Q3: Which export format(s) are in scope?
  options: A CSV only (Recommended) | B CSV+XLSX | C XLSX only
A3: A [CLICKED] — XLSX to be iceboxed explicitly at MAP.
Q4: How does "without the app freezing" become mechanically checkable?
  (recon fact disclosed: 10k rows ≈ sub-MB CSV; sync generation is single-digit
  ms, so freezing is physically unlikely at current scale)
  options: A chunked/async + progress state, yield-proof test + 10k smoke
           (Recommended) | B smoke-only, non-freezing rests on data size
A4: A [CLICKED]
Q5: Adopt the five-line Done-when block? (all commands executed this session;
  floors proposed: ≥12 export tests, ≥75 total, dist ≤230 kB)
  options: A adopt as written (Recommended) | B drop bundle line | C adjust floors
A5: A [CLICKED]
P5: commands proven live: npm test → 63 green; typecheck → 0; build → 0 +
    du 216; vitest src/utils/ → 18 passed (path-filter semantics);
    vitest src/export/ → exit 1 today [FACT-CONFIRMED]
=> charter lines written: §Done-when, five lines as adopted.

## Scope
Q6: What does exporting "what I'm currently looking at" include?
  options: A all filtered+sorted rows, paging ignored (Recommended) |
           B current page only | C both, user picks
A6: A [CLICKED]
Q7: Is the five-item In-list the smallest version you'd still call success?
  options: A yes — this is v1 (Recommended) | B strip progress state |
           C something missing
A7: A [CLICKED]
Q8: Which are explicitly OUT? (multi-select; all four recommended)
  options: toast/notification system | copy-to-clipboard | export-settings UI |
           keyboard shortcut
A8: all four [CLICKED]
Q9: Which are explicitly OUT? (multi-select; all four recommended)
  options: lint/format tooling | opportunistic refactors | dependency
           upgrades | README/docs expansion (except one smoke-script line)
A9: all four [CLICKED]
Q10: Confirm the Scope section as written? (read-back included the
  standard-temptation Out lines: PDF, server-side, telemetry, i18n, plus the
  destination-derived no-behavior-change line)
  options: A confirmed (Recommended) | B remove/soften a line
A10: A [CLICKED]
=> charter lines written: §Scope In (4 items) + Out (13 lines), verbatim.

## No-touch zones
Q11: Which paths are no-touch? (multi-select; all four recommended)
  options: src/data/fixtures.ts | src/test/setup.ts |
           .github/workflows/ci.yml | build/config bundle (vite.config.ts,
           tsconfig.json, index.html)
A11: all four [CLICKED]
P11: drafted section shown verbatim; confirmed by proceeding to Q12 with no
     edit flagged [FACT-CONFIRMED]
=> charter lines written: §No-touch zones, four entries.

## Priorities
Q12: Which strict ranking governs Type 2 tiebreaks?
  options: A regressions > conventions > completeness > polish (Recommended) |
           B regressions > completeness > conventions > polish
A12: A [CLICKED]
=> charter lines written: §Priorities 1–4.

## Silence-defaults
Q13: Fidelity rule when the spec is silent?
  options: A WYSIWYG — export mirrors rendered table (Recommended) |
           B raw underlying values (flagged: would reopen Destination)
A13: A [CLICKED]
Q14: Persistence rule?
  options: A nothing new persists; prefs schema frozen (Recommended) |
           B prefs store additions as Type 2
A14: A [CLICKED]
Q15: Dependency rule?
  options: A total freeze, runtime + dev; needs → decision ticket
           (Recommended) | B dev-deps as Type 2
A15: A [CLICKED]
Q16: Visual & copy rule? (evidence cited: Button has aria-busy, Spinner has
  role=status, aria-live=polite precedent, CSS custom properties, sentence-case
  strings)
  options: A match the repo (Recommended) | B novel visuals halt
A16: A [CLICKED]
P16: full section (template default-of-defaults + six rules) shown verbatim;
     confirmed by proceeding to Q17 with no edit flagged [FACT-CONFIRMED]
=> charter lines written: §Silence-defaults, preamble + six rules.

## Stall policy
Q17: Which stall package?
  options: A descope-where-safe: blocked→icebox, conflict→halt, done-when
           unmet→halt, pre-existing CI red→note-and-continue (Recommended) |
           B maximal halt
A17: A [CLICKED]
=> charter lines written: §Stall policy, four lines.

## Budgets
Q18: Which budget package?
  options: A scaled + spec pause: sessions 40, parallel 2, ci_wait 15,
           max_hours 24, pause_after_spec true (Recommended) |
           B scaled, no spec pause | C template defaults
A18: A [CLICKED]
=> charter lines written: §Budgets, twelve values.

## Merge & CI
Q19: Confirm merge policy?
  options: A auto-merge on green, no human review gate (Recommended) |
           B require human review per PR (flagged: collapses the unattended
           premise)
A19: A [CLICKED]
=> charter lines written: §Merge & CI policy, four lines; repo settings to be
   verified at preflight.

## Quality invariants + Tech constraints
Q20: Confirm both sections as written? (proposals-to-edit; all lines trace to
  measured baselines or earlier decisions)
  options: A confirm both (Recommended) | B edit a line
A20: A [CLICKED]
=> charter lines written: §Quality invariants (4 lines, baselines tests=63
   xfail=0 skip=0, bundle ≤230/216) + §Tech constraints (6 lines).

## Glossary
D21: four terms harvested from the interview (view, export, in-progress
  state, large result set) presented for the first time inside the full
  read-back; accepted with the final gate → [DEFAULT-ACCEPTED]
=> charter lines written: §Glossary, four definitions.

## Full read-back
Q21: Confirm the full charter and write it to auto/csv-export?
  options: A confirmed — write it (Recommended) | B change the arc name |
           C edit a section first
A21: A [CLICKED]
Confirmed by human: 2026-07-28T23:33Z
