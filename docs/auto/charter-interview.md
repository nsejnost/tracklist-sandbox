# Charter interview — xlsx-export — 2026-07-30 — mode: RENEWAL

Renewal of csv-export → smoke-gate (both archived under docs/auto/archive/).
Recon (Phase 0, 2026-07-30, in-session): baselines green — `npm test` 80/80 (13
files, 0 skip/xfail) · `npm run typecheck` exit 0 · `npm run build` exit 0,
`du -sk dist/` = 216 · `npm run test:smoke` prints `csv:ok rows=10000` · Node
v22.22.2 · deps pinned (React 19, zustand 5, Vite 8, vitest 4, TS 7) ·
codingstandards.md present · CI = .github/workflows/ci.yml (npm ci, test,
typecheck, build, test:smoke; on push + pull_request, unfiltered).
Attendance measured 2026-07-30: human typed a clarification request on Q1 →
attended interview confirmed.

## Destination
Q1: [arc direction — full template block delivered inside the clickable prompt]
  Deciding: the new arc's direction (Destination + arc name). Why it matters
  mid-run: the Decider resolves every ambiguous runtime question against
  Destination + Priorities. A — XLSX export (Pros: twice-deferred candidate; CSV
  seam exists; user value. Cons: collides with dependency freeze; hand-rolled
  .xlsx is real engineering / a library breaks the 216KB ratchet; largest scope).
  B — Hardening/hygiene arc (Pros: retires icebox debt; small low-risk tickets.
  Cons: no user feature; must unfreeze ci.yml + scripts/). C — XLSX + hygiene
  ride-alongs (Pros: debt retired en route. Cons: largest scope; mixed review
  postures). Recommendation: A (only candidate both prior charters named as the
  expected next arc; the dependency fork is what this interview exists to settle).
  + Other-clarification reminder.
  options: A XLSX export (Recommended) | B Hardening & hygiene | C XLSX + hygiene
C1: "Before I answer: run cat ~/.claude/skills-provenance.txt and show the exact
    output, then re-present this question." → ran it; output shown verbatim in
    chat (setup v22 ran 2026-07-29T23:38:37Z, clone failures 0; claude-skills @
    e8cc074; matt-skills @ 2ab9580); original question re-presented unchanged
    [CLARIFICATION]
A1: A — XLSX export [CLICKED]
=> arc = XLSX export; slug xlsx-export (confirmed at Destination read-back)

Q2: [fidelity bar — full template block in prompt]
  Deciding: Destination's fidelity bar (how cells are typed). Why mid-run: the
  Decider judges every fidelity fork against it; too low = CSV-with-extension, too
  high = styling scope creep. A — Typed parity (Pros: the only real reason to
  prefer XLSX; bounded; no styling. Cons: per-column typing decision). B —
  Plain-cell strings (Pros: simplest; zero typing. Cons: adds ~nothing over CSV).
  C — Styled workbook (Pros: most polish. Cons: largest scope/bundle; polish ranks
  last). Recommendation: A. + reminder.
  options: A Typed parity (Recommended) | B Plain-cell parity | C Styled workbook
A2: A — Typed parity [CLICKED]

Q3: [per-column cell types — full template block in prompt]
  Deciding: per-column cell-type contract (writes the core Done-when assertions).
  Why mid-run: the `numeric:true` flag marks distance, duration, AND pace — but
  duration renders "1:15:15" (raw 4515s) and pace "5:31 /km" (raw 331); mechanical
  flag-typing puts bare seconds in the sheet, a regression below the CSV. A —
  Measurement-numeric (Pros: distance gets real numeric value, time columns stay
  readable; zero styling; lossless unit→header. Cons: one numeric column; renames
  Distance header in workbook). B — Flag-driven raw numbers (Pros: mechanical.
  Cons: duration/pace bare seconds — worse than CSV). C — Full native types (Pros:
  maximal fidelity. Cons: number-formats = styling, excluded by the bar; bytes;
  date-serial gotcha). Recommendation: A. + reminder.
  options: A Measurement-numeric (Recommended) | B Flag-driven raw | C Full native
A3: A — Measurement-numeric [CLICKED]
=> Destination drafted; read back verbatim in chat.
DR1: Destination + arc slug xlsx-export confirmed [CLICKED "Confirmed — go to
    Done-when"]

## Done-when
Q4: [validation posture — full template block in prompt; all lines executed at
    interview time, evidence embedded]
  Deciding: the Done-when line set / validation posture; .xlsx is binary
  ZIP-of-XML and the dependency freeze bars an xlsx-reader parser. Why mid-run:
  these commands are the only thing that ends the run. A — Full parity, dep-free
  (5 lines: suite / xlsx cell-type unit tests on in-memory model / typecheck /
  build+du≤240 / real-path 10k smoke with structural ZIP validation; Pros: proves
  cell types AND 10k real path; zero new deps; mirrors last two arcs. Cons:
  structural not deep-parse). B — Unit-tests-only (Pros: smallest diff, no CI
  touch. Cons: no 10k real-path coverage). C — Allow dev-only parser (Pros:
  deepest. Cons: breaks freeze, Type 1 ADR). Recommendation: A. + reminder.
  Executed 2026-07-30: npm test→80/80; typecheck→0; build+du→216; csv smoke→
  csv:ok rows=10000; `npx vitest run src/export/xlsx`→exit 1 "No test files
  found"; `node scripts/smoke-export-xlsx.mjs`→exit 1 "Cannot find module" — both
  determinate, defining termination not entry.
  options: A Full parity dep-free (Recommended) | B Unit-tests-only | C Dev parser
A4: A — Full parity, dependency-free [CLICKED]
=> Done-when drafted (5 lines); read back verbatim in chat.
DWR1: Done-when confirmed (≥90 tests, ≤240 bundle knobs accepted) [CLICKED
    "Confirmed — go to Scope"]

## Scope
Q5: [Scope-In / UX bar — full template block in prompt]
  Deciding: smallest version of success; open fork = UX bar + download trigger.
  Why mid-run: existing CSV export is async-chunked (no 10k freeze) with
  busy/error on one Export button. A — Full parity with CSV (async-chunked reuse +
  busy/error; second "Export XLSX" button beside relabeled "Export CSV"; Pros:
  proven non-freezing UX; pattern exists to copy; Priority-1 + convention. Cons:
  relabels current button). B — Minimal synchronous (Pros: least code. Cons: 10k
  main-thread jank). C — Format picker (Pros: cleanest as formats grow. Cons: new
  UI pattern/state; polish over completeness). Recommendation: A. + reminder.
  options: A Full parity (Recommended) | B Minimal synchronous | C Format picker
A5: A — Full parity with CSV [CLICKED]

Q6: [Scope-Out adversarial — full template block in prompt; multiSelect]
  Deciding: which tempting xlsx additions are explicitly OUT (select all to bar;
  recommend all four; unselected → "might want in", follow up). Why mid-run: each
  is something an unattended agent could sincerely build; silence is what eager
  agents exploit. Styling & number-formats → OUT (contradicts typed-parity-no-
  styling; date-serial gotcha; bytes). DEFLATE ZIP → OUT, stored entries only
  (async/CRC complexity for a fine-uncompressed download). Extra sheet content
  (totals/summary/freeze/auto-filter) → OUT (invents data beyond the view).
  Format/settings UI → OUT (unneeded settings surface). Recommendation: all four
  OUT. + reminder.
  options: [x] Styling & number-formats | [x] DEFLATE ZIP | [x] Extra sheet
    content | [x] Format/settings UI
A6: ALL FOUR selected OUT [CLICKED multi]
=> Scope drafted (In 6 items / Out temptations + carries); read back verbatim.
SR1: Scope confirmed [CLICKED "Confirmed — next section"]

## Merge & CI  (carried from smoke-gate; one fresh decision)
Q7: [xlsx smoke in CI — full template block in prompt]
  Deciding: wire the xlsx smoke into ci.yml (+ npm script + README line) as
  smoke-gate did for csv; also decides ci.yml no-touch status. Why mid-run: xlsx
  Done-when has a 10k smoke; question is whether it guards every future PR. A —
  Wire it (mirror smoke-gate; new script + test:smoke:xlsx + one appended ci.yml
  step + one README line; ci.yml touchable ONLY for that step; Pros: same every-PR
  protection as csv; precedented bounded change; step passes the normal gate.
  Cons: narrowly unfreezes the judging workflow; +1 step; +1 README line). B —
  Local/Done-when only (Pros: frozen workflow. Cons: inconsistent with csv;
  contributor PRs never run xlsx real-path check). Recommendation: A. + reminder.
  options: A Wire it into CI (Recommended) | B Local/Done-when only
A7: A — Wire it into CI [CLICKED] => ci.yml touchable ONLY for the appended
    xlsx-smoke step

## No-touch zones  (feature arc: src/** unfrozen; two fresh freezes)
Q8: [arc-specific no-touch freezes — full template block in prompt; multiSelect]
  Deciding: which shipped modules to freeze so xlsx can't regress them; carries
  (fixtures.ts, test/setup.ts, vite/tsconfig/index.html, package-lock.json,
  archive/**, scripts/*.mjs, ci.yml-except-appended-step) auto-apply. Why mid-run:
  touching a no-touch path fails integrate regardless of green tests; freezing
  makes Priority-1 zero-regression structural. Freeze src/export/csv.ts → protect
  shipped CSV export; xlsx self-contained (Con: no shared-seam carve-out).
  Freeze column/type model (src/types.ts + src/utils/columns.ts) → protect domain
  model; xlsx typing in export module (Con: no ColumnDef.xlsxCell extension).
  Recommendation: freeze both. + reminder.
  options: [x] Freeze src/export/csv.ts | [x] Freeze column/type model
A8: BOTH frozen [CLICKED multi]

## Batch-1 read-back (Priorities + No-touch + Merge & CI, printed verbatim)
B1R: Confirmed as written; pause_after_spec=false accepted [CLICKED "Confirmed —
    next batch"]

## Batch-2 read-back (Silence-defaults + Stall + Budgets + Quality invariants +
##   Tech constraints + Glossary, printed verbatim — carried proposals)
P2a: Silence-defaults (carried from csv-export + xlsx rules) [DEFAULT-ACCEPTED]
P2b: Stall policy (carried) [DEFAULT-ACCEPTED]
P2c: Budgets (max_sessions 30, max_parallel 2, ci_wait 15, arch_every 5,
    max_hours 24, pause_after_spec false, mutation_check false) [DEFAULT-ACCEPTED]
P2d: Quality invariants (baselines recon 2026-07-30 tests=80 xfail=0 skip=0/13,
    bundle=216, ratchet ≤240; CI cmds incl test:smoke + test:smoke:xlsx)
    [FACT-CONFIRMED]
P2e: Tech constraints (carried + xlsx serializer note) [DEFAULT-ACCEPTED]
P2f: Glossary (harvested from interview usage) [DEFAULT-ACCEPTED]
B2R: Confirmed as written [CLICKED "Confirmed — assemble charter"]

## Coordination branch
QB: [branch conflict — full template block in prompt] skill requires
    auto/xlsx-export vs task default claude/autopilot-charter-welqoh; explicit
    permission requested. Recommendation: A (auto/xlsx-export; skill can't
    function otherwise; matches prior arcs).
    options: A Push to auto/xlsx-export (Recommended) | B Use claude/autopilot-...
AB: A — Push to auto/xlsx-export [CLICKED] (explicit permission granted)

## Full read-back
Draft pushed to auto/xlsx-export with sentinel line present; printed verbatim in
chat for the full-charter read-back.
Confirmed by human: <pending — stamped on confirmation, then sentinel removed and
state.md status:READY set>
