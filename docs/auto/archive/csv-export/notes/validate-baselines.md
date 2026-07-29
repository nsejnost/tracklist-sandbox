# VALIDATE baselines — csv-export

Recorded: 2026-07-29T01:38Z · session 7d94f2a9 · container-fresh `npm ci`, all
commands run as written from repo root on `origin/main` (via auto/csv-export,
which carries no src changes).

## Done-when lines — arc-start status

| # | Command (as written) | Result | Status |
| - | - | - | - |
| 1 | `npx vitest run src/export/` | exit 1 — no test files (dir absent) | UNMET (expected: dir created by arc) |
| 2 | `npm test` | exit 0 — 10 files, 63/63 passed, 0 skipped | runs green; UNMET (63 < 75 target) |
| 3 | `npm run typecheck` | exit 0 | MET |
| 4 | `npm run build` → `du -sk dist/` | exit 0 → 216k | MET (≤ 230) |
| 5 | `node scripts/smoke-export.mjs` | exit 1 — module not found (script absent) | UNMET (expected: script created by arc) |

All five commands execute with determinate results — none missing, malformed,
or hanging. Unmet-at-start is expected; Done-when defines termination.

## Ratchet baselines (charter §Quality invariants — verified in-container)

- tests: 63 passed / 10 files / 0 skipped / 0 todo (matches charter recon
  baseline 2026-07-28 exactly)
- xfail: 0 · skip: 0
- bundle: `du -sk dist/` = 216k (ratchet ceiling 230)
- typecheck: clean
