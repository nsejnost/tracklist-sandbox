# TICKETS mergeability-skeptic findings — s05 (2026-07-29)

Fresh-context skeptic attacked the one-slice plan (ticket #01 carrying all
three surfaces). Verdict: **OVERALL PASS — one-slice stands.** 5 NO-ISSUE,
2 NIT, 0 SHOULD-FIX, 0 BLOCKER. Dispositions below; empirical evidence was
gathered live in the container, not assumed.

| # | Sev | Finding | Disposition |
|---|-----|---------|-------------|
| 1 | NO-ISSUE | Ordering hazard is real: `npm run <missing>` exits 1 (verified), so a CI-step ticket merged before the script ticket reddens main's next push. Smoke script's output line verified at `scripts/smoke-export.mjs:58`. | Defense's factual core confirmed. |
| 2 | NO-ISSUE | A safe split DOES exist (blocked_by chain, max_parallel=1) — the ticket's defense paragraph overstates "splitting creates an ordering hazard". But the chain costs +2 sessions (budget at 5/12), +2 CI waits, 3× the R4 suite, for zero risk reduction on a ~3-line diff; `--if-present` alternative violates frozen R2 and converts missing-script into permanent silent green. | Atomicity dominates on the merits; no change (spec froze the shape). |
| 3 | NO-ISSUE | 17 acceptance lines ≠ big ticket: 12 are sub-second greps; the 5 R4 lines run at integrate under ANY slicing (a split runs them 3×). Longest item `npm ci` ~1–2 min vs max_session_minutes 90. Heuristics tripped on proxy counts; the proxied quantities (diff ~3 lines, 0 new seams) are far under threshold. | One-session-sized confirmed. |
| 4 | NIT | 4 of 17 lines (two numstats, two name-only diffs) break spuriously if a human pushes to main mid-arc, burning an attempt. Fail-loud-on-drift is the right polarity (diff-against-merge-base would trade false-red for false-green, inverting Priority 1). | APPLIED: one sentence added to ticket evidence rules — upstream-drift failure ⇒ rebase onto new tip and rerun, does not consume an attempt. |
| 5 | NO-ISSUE | All R2 guards jointly satisfiable against the REAL ci.yml: 4 run-steps @ 6-space indent, 2 `uses:`, no trailing blank line (byte-checked, trailing newline present in all three target files); appending one step at EOF satisfies numstat `1 0` + `tail -1` + counts simultaneously. | Verified against main tip; working tree byte-identical to origin/main for all three files. |
| 6 | NIT | package.json has no shape guard (R1 lacks a numstat line) — a worker could reformat wholesale and stay green, violating spec R1 prose "No other package.json change". Subtlety: inserting `test:smoke` last forces a comma edit (numstat `2 1`); inserting after `"test"` gives clean `1 0`. | LEFT (per skeptic): acceptance is frozen-spec-verbatim — a ticket-only guard would desync ticket from spec; risk is cosmetic (lockfile separately guarded), squash-diff + review axis cover it. Worker hint about the clean insertion point added to the ticket instead. |
| 7 | NO-ISSUE | No red-on-main window: pull_request CI runs the HEAD branch's workflow, so the appended step proves itself pre-merge with the script present; README pre-state verified (one smoke line, both occurrences on line 19). Job runtime fits ci_wait_minutes 15. | Confirmed. |
