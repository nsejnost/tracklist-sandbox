# VALIDATE baselines — smoke-gate — 2026-07-29 (session s01)

Charter checks:
- Sentinel line: absent (grep -c "STATUS: TEMPLATE" → 0)
- Priorities: 4 entries, strictly ranked, no ties
- Budgets: all numeric/boolean; max_sessions: 2 carries the charter's
  DELIBERATE STARVATION drill note (budget HALT after MAP is expected)
- No-touch zones: 4 listed (src/**, config trio, package-lock.json,
  docs/auto/archive/**)

Done-when lines, executed as written (unmet at arc start is expected — they
define termination, not entry):
- `npm run test:smoke` → exit 1 (Missing script) — runs, determinate, UNMET
- `grep -c "test:smoke" .github/workflows/ci.yml` → 0, exit 1 — determinate, UNMET
- `grep -c "test:smoke" README.md` → 0, exit 1 — determinate, UNMET

Ratchet baselines (run once in this session's container):
- `npm test` → exit 0, 80/80 tests passing, 13 files, 0 skipped, 0 xfail
- `npm run typecheck` → exit 0
- `npm run build` → exit 0; `du -sk dist/` → 216 (charter ratchet: ≤ 216)
- `node scripts/smoke-export.mjs` → `csv:ok rows=10000`, exit 0

Environment: same container class as preflight (Node 22 in CI per
.github/workflows/ci.yml; suite green in-container — no missing env/secrets).
