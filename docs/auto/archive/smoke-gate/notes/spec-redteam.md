# SPEC red-team pass — smoke-gate — 2026-07-29 (s04)

Fresh-context red-team subagent attacked spec.md on three questions
(author-would-hate / silent assumptions / traces-to-nothing). Verdict: no
BLOCKERs, 3 SHOULD-FIX, 4 NIT. Dispositions, all same-session:

1. SHOULD-FIX — "every R1–R3 command runs red before the edit" was false
   for two standing guards (`uses:`=2, smoke-line=1) which are green by
   design. **Fixed**: §Seams and §Testing decisions now distinguish
   content-adding commands (red→green, evidence logged) from standing
   guards (green throughout, no red run).
2. SHOULD-FIX — count/tail-based acceptance could pass vacuously under a
   reorder (CI) or an out-of-place bare mention (README), violating the
   charter's never-reorder / replace-in-place defaults. **Fixed**: added
   `git diff --numstat origin/main` shape guards (`1 0` for ci.yml, `1 1`
   for README.md) and an exact-line `grep -E` for the README replacement
   (internal spacing left free for the fence's comment-column convention).
3. SHOULD-FIX — no-touch diff checks lacked an exit-code clause and a
   fetch precondition; a broken/stale `origin/main` ref would read as
   "pass". **Fixed**: both lines now `git fetch origin main && … → exit 0,
   empty output`.
4. NIT — ticket #01's acceptance list lacks the spec's guard commands.
   **Deferred to TICKETS by design**: that phase copies acceptance lines
   verbatim from the frozen spec into tickets; reconciliation happens
   there, next session.
5. NIT — `tail -1` spuriously red on a trailing blank line. **Resolved by
   fix 2**: the `1 0` numstat guard forbids any stray blank line, making
   `tail -1` exact; parenthetical updated.
6. NIT — npm acceptance lines silently assumed installed dependencies.
   **Fixed**: §Testing decisions states the `npm ci` precondition,
   mirroring ci.yml's own order.
7. NIT — "Out of scope … verbatim" had trimmed the charter's operative
   clause. **Fixed**: restored "…never into the ticket."

Red-team also verified the spec's factual claims against the tree (job key
`ci`, 2 `uses:` / 4 `- run:` steps, README raw line last in fence, script
prints `csv:ok rows=10000`, decisions.md absent, VALIDATE "smoke ok"
baseline traces to notes/validate-baselines.md) — all true.
