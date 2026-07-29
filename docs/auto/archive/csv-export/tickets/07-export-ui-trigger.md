# 07 — Build: export trigger in the table UI (busy + inline failure + download)
type: build
status: merged
blocked_by: 06
charter_refs: §Scope-In(trigger; visible in-progress state; failure inline in the control's own state), §Scope-Out(no toasts/shortcuts/settings UI), §Silence-defaults(Visual: Button+Spinner, styles.css custom properties; Copy/aria patterns), §No-touch, §Priorities 1
seams: S2 (existing component pattern; delta fixed by spec §Seams per D-0011/0012/0014): ToolbarProps grows exactly { onExport: () => void; exportStatus: 'idle' | 'exporting' | 'error' }; Button busy/aria-busy drive the in-progress state; error region is an ALWAYS-MOUNTED role="status" aria-live="polite" element at row-2 end whose text is "" or "Export failed"; Blob/object-URL/anchor/revoke wiring inline in App.tsx (D-0011 no new file). Consumes S1 via exportCsv only.
touches: src/App.tsx, src/components/Toolbar.tsx, src/styles.css, src/components/Toolbar.test.tsx (new), src/App.export.test.tsx (new)
attempts: 1/3
pr: #6
split_generation: 0

## What to build
Spec R4+R5+R6+R7 — the user-visible tracer bullet. R4: a `Button` labeled
"Export" (D-0013), variant ghost (D-0015), in toolbar row 2 after Refresh
(D-0014); clicking exports the CURRENT view — the filtered+sorted rows array
and visible columns App already derives via its useMemo view, captured at
click; paging ignored (D-0011, §Glossary(view)). App owns transient status
via useState ('idle'|'exporting'|'error') mirroring the refreshing/onRefresh
precedent — no new store, no new file. R5: while the export promise is
pending, the existing busy pattern (busy Button → aria-busy="true", Spinner,
disabled); busy ends on settle; rejection settles into 'error'; 'idle' only
after resolve or retrigger-clear (D-0012). R6: on rejection the adjacent
status element shows exactly "Export failed" (D-0016); no toast machinery;
message clears when a new export starts. R7: on resolve construct exactly
new Blob([text], { type: "text/csv;charset=utf-8" }) — single part, engine is
the sole BOM writer — create an object URL, click an anchor with
download="tracklist.csv" (D-0005), revoke the URL on a deferred schedule
after the click dispatch (D-0007 line 7). Styling extends styles.css via
existing custom properties and flat class names, toolbar row-2 rhythm; no new
colors/tokens. Tests T13–T17 per spec §Testing decisions, in the two NEW
files only (src/components/Toolbar.test.tsx, src/App.export.test.tsx —
existing test files frozen per R8): testing-library role queries, vi.fn() +
exact-arg assertions; T14 first narrows the view via a route filter to a
known fixture subset, then asserts exact rows/columns args; sanctioned
doubles only — App-level vi.mock('./export/csv'), vi.stubGlobal for
URL.createObjectURL/revokeObjectURL, vi.spyOn(HTMLAnchorElement.prototype,
'click').mockImplementation(() => {}); REAL timers; while busy two
role="status" nodes coexist (Spinner + error region) — queries disambiguate
by accessible name or within().

## Acceptance (executable — verbatim from spec R4–R8)
- run: npm test   expect: exit 0; T13–T17 green in the two NEW files only; total = 80 (63 baseline + 12 export + 5 UI; arc floor ≥75 per R8); no existing src/**/*.test.* file modified
- run: npm run typecheck   expect: exit 0
- run: npm run build && du -sk dist/   expect: exit 0; dist ≤ 230 (baseline 216)
- run: test -z "$(grep -rn buildCsvSync src scripts 2>/dev/null | grep -v src/export)"   expect: exit 0 (UI consumes exportCsv only)

## Work log
- 2026-07-29T04:40Z TICKETS: mergeability-skeptic pass ran (independence holds; finding 4: baseline tests survive the always-mounted status region — Button.test renders Button in isolation, App.test has no status-role queries; Button.tsx already ships ghost+busy, no Button edit needed; finding 6: big-but-atomic, do NOT split — R5/R6/R7 are one state machine; ~250–360 line diff estimate). Amendments applied: total = 80 pinned; oracle-ban guard exit-0 form. Wave note: #07 is the long pole — dispatch first in the wave.
- 2026-07-29T06:51Z BUILD wave 2: worker built Toolbar.tsx (ToolbarProps seam S2, Export button, status region) + App.tsx (exportStatus state, handleExport with Blob/URL/anchor/deferred-revoke inline per D-0011) + Toolbar.test.tsx (T13/T15) + App.export.test.tsx (T14/T16/T17); T13/T15 genuine red->green (red evidence: missing-role failure, then busy-name-folds-with-Spinner failure fixed to match repo's own Button.test.tsx precedent of name:/Export/ under busy); T14/T16/T17 implementation landed in the same edit as T13/T15 because growing ToolbarProps broke App.tsx's compile — worker flagged this itself as a process deviation from strict one-test-at-a-time. T17 caught two real bugs during its own development: a test-isolation leak (unstubbed download chain surviving into later tests, fixed via a never-resolving retrigger promise) and a racy "not yet called" revoke assertion (fixed via call-order tracking). 3 commits (5fed6ad, b70be20, 0dbb33f). Fresh reviewer did NOT just trust the "went green on first write" claim — independently verified T14/T16/T17 are non-tautological and would catch the regressions the ticket cares about (pageRows-vs-sorted, stale error text, wrong Blob/anchor wiring) by mentally mutating the implementation; found Standards clean (1 non-blocking nit: styles.css in touches but left unmodified — no dedicated error-state CSS, no regression), Spec-faithfulness clean, 1 non-blocking test-quality gap (T17 proves click-before-revoke order, not literal setTimeout deferral). VERDICT PASS, 0 fix rounds. INTEGRATE gate: rebased onto origin/main (now including #08's merge) — clean, no conflicts; full local gate re-run (80/80 tests, typecheck 0, build 216k<=230, oracle guard clean, smoke still csv:ok); diff = exactly the ticket's touches (minus styles.css) + the two new test files, no no-touch/no baseline-test-file/no package.json changes. PR #6 opened, CI green (2/2 checks), squash-merged b6f5e5b. Remote branch deletion 403'd in-session (same known limitation) — left in place, cosmetic.
- 2026-07-29T07:00Z FINISH: MAP fully closed (8/8 nodes merged/closed) with #07's merge; all 5 charter Done-when lines re-verified green against main@b6f5e5b; end-of-arc architecture checkpoint ran scoped to this arc's footprint, 3 findings all triaged Deferred to icebox.md (none Blocking, none met the Strong bar for a bounded-refactor ticket) -> arc status DONE.
