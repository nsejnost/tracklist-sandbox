# DONE — smoke-gate — 2026-07-29
Shipped: #01 Wire smoke gate (npm script + CI step + README) → PR #10, squash 2f00358
Done-when results (run against main @ 2f00358, after npm ci):
- `npm run test:smoke` → exit 0, printed `csv:ok rows=10000`
- `grep -c "test:smoke" .github/workflows/ci.yml` → 1 (≥1)
- `grep -c "test:smoke" README.md` → 1 (≥1)
Full sweep on main: npm test 80/80 passed (13 files, 0 skipped) · typecheck exit 0 · build exit 0, du -sk dist/ = 216 (ratchet ≤216 held exactly)
Decisions: 0 (Type 1 ADRs: none — every fork was charter-pinned; ledger never seeded)
Architecture findings for next arc: 9 in icebox (2 next-arc-candidate, 7 monitor); pass also verified healthy: npm cache present, step order fail-fast-sane, smoke 0.4s, naming coherent, exit codes correct, oracle independence held
Icebox: 11 total — 2 charter carries (XLSX export; ExportStatus hoist/src changes) + 9 arch-pass entries above
Blocked/descoped: none
Sessions used: 7/12 · waves: 1 · attempts spent: 1 (#01: 1/3)
Process notes: red-team passes at SPEC (7 findings) and TICKETS (7 findings) all dispositioned; review APPROVE zero findings; one protocol miss self-corrected (sessions_used increment moved into claim commit from s06 on); scheduling lane dead all run (send_later denials/outages) — human-poked chain per launch note.
