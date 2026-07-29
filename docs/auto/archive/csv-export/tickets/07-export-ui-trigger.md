# 07 — Build: export trigger in the table UI (busy + inline failure + download)
type: build
status: open
blocked_by: 06
charter_refs: §Scope-In(trigger; visible in-progress state; failure inline in the control's own state), §Scope-Out(no toasts/shortcuts/settings UI), §Silence-defaults(Visual: Button+Spinner, styles.css custom properties; Copy/aria patterns), §No-touch, §Priorities 1
seams: S2 (existing component pattern; delta fixed by spec §Seams per D-0011/0012/0014): ToolbarProps grows exactly { onExport: () => void; exportStatus: 'idle' | 'exporting' | 'error' }; Button busy/aria-busy drive the in-progress state; error region is an ALWAYS-MOUNTED role="status" aria-live="polite" element at row-2 end whose text is "" or "Export failed"; Blob/object-URL/anchor/revoke wiring inline in App.tsx (D-0011 no new file). Consumes S1 via exportCsv only.
touches: src/App.tsx, src/components/Toolbar.tsx, src/styles.css, src/components/Toolbar.test.tsx (new), src/App.export.test.tsx (new)
attempts: 0/3
pr: -
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
