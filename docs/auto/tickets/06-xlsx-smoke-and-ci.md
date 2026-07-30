# 06 — Real-path xlsx smoke script + CI/README/npm wiring
type: task
status: open
blocked_by: 03
charter_refs: §Done-when 5 (node scripts/smoke-export-xlsx.mjs → xlsx:ok rows=10000), §Scope-In(scripts/smoke-export-xlsx.mjs), §Merge&CI(wire into ci.yml + npm script + README line), §No-touch(ci.yml touchable ONLY for the appended step; scripts/smoke-export.mjs + resolve-ts-hook.mjs frozen)
seams: `scripts/smoke-export-xlsx.mjs` (mirrors scripts/smoke-export.mjs); npm script `test:smoke:xlsx`; the one appended ci.yml step
touches: scripts/smoke-export-xlsx.mjs (new), package.json, .github/workflows/ci.yml, README.md
attempts: 0/3
split_generation: 0

## What to build
The full-scale real-path gate for xlsx, mirroring the shipped csv smoke (`scripts/smoke-export.mjs`, which is No-touch — copy its shape, don't edit it):
- `scripts/smoke-export-xlsx.mjs`: exports the full 10,000-row seeded fixture set through the **real** xlsx code path (#03's serializer, under Node 22 TS type-stripping via the existing `scripts/resolve-ts-hook.mjs`) and **structurally validates** the workbook dependency-free: ZIP magic bytes present, `[Content_Types].xml` + `xl/worksheets/sheet1.xml` present, exactly 10,000 data rows. Prints `xlsx:ok rows=10000` and exits 0 on success; nonzero otherwise.
- `package.json`: add script `test:smoke:xlsx` → `node scripts/smoke-export-xlsx.mjs`.
- `.github/workflows/ci.yml`: append exactly one step `- run: npm run test:smoke:xlsx` AFTER the existing `test:smoke` step — no other change to the workflow (No-touch except this).
- `README.md`: add one line to the existing Commands section documenting `npm run test:smoke:xlsx`.

Split candidate at TICKETS (deliverables joined by "and"): 06a = the smoke script; 06b = npm/ci/README wiring. Keep as one if the diff stays small.

## Acceptance (final — TICKETS s05, from spec.md R6)
- run: `node scripts/smoke-export-xlsx.mjs`   expect: prints `xlsx:ok rows=10000`, exit 0
- run: `npm run test:smoke:xlsx`   expect: prints `xlsx:ok rows=10000`, exit 0
- run: `grep -c "test:smoke:xlsx" .github/workflows/ci.yml`   expect: ≥ 1
- run: `grep -c "test:smoke:xlsx" README.md`   expect: ≥ 1
- run: `git diff --name-only origin/main -- .github/workflows/ci.yml`   expect: only `.github/workflows/ci.yml` differs, and the ONLY content change is the one appended `- run: npm run test:smoke:xlsx` step (Auditor note carried from s04: enforce content, not just filename).

## Work log
- 2026-07-30T04:19Z s02 (MAP): node created. Blocked by #03 (needs the real serializeXlsx path). Narrowly unfreezes ci.yml for one appended step per charter Merge&CI.
- 2026-07-30T06:15Z s05 (TICKETS): acceptance FINALIZED verbatim from spec R6. **blocked_by 03 confirmed correct (skeptic F4):** the smoke imports only `serializeXlsx` + `fixtures` + `COLUMNS` (#03), not `exportXlsx` (#04) or the UI (#05) — so #06 may merge before #04/#05 without wedging their PRs (serializeXlsx is already on main). **Declined the skeptic's F6 suggestion to add a `du` gate to ci.yml:** the charter §No-touch bars any ci.yml change beyond the single appended smoke step, so the bundle ratchet stays enforced at the autopilot INTEGRATE step + #05's acceptance, never CI. Tightened the ci.yml diff acceptance to a content check per s04's Auditor note. Sizing: `task` ticket, 4 tiny cohesive wiring edits (one script mirroring the csv smoke + 3 one-liners) → comfortably one session; kept as one, not split into 06a/06b.
