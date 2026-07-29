# Icebox — smoke-gate (append-only)

- 2026-07-29 | MAP | XLSX export — carried from the csv-export icebox
  (docs/auto/archive/csv-export/icebox.md) via this charter's §Scope-Out:
  explicitly deferred to a future arc; nothing in this arc builds toward it.
- 2026-07-29 | MAP | ExportStatus union hoist (one named type instead of the
  inline `'idle' | 'exporting' | 'error'` duplicated in App.tsx and
  Toolbar.tsx) — carried from the csv-export icebox (rated "Worth
  exploring") via this charter's §Scope-Out; `src/**` is a no-touch zone
  this arc, so it stays deferred.

## End-of-arc architecture pass — smoke-gate (2026-07-29, main @ 2f00358)
- [next-arc-candidate] No single local command reproduces the gate (CI runs 4 npm invocations, no aggregate): add a `check` script mirroring CI's step list and make CI call it — one source of truth.
- [next-arc-candidate] Smoke run silently requires Node's default TS type-stripping (≥22.18) — no engines field, no .nvmrc, no README note: declare `engines.node` or one README line stating the Node floor.
- [monitor] resolve-ts-hook.mjs maps only extension-less relative specifiers (no .tsx, no index/dir imports, no tsconfig paths, no non-erasable syntax); goes live when src/ unfreezes — document the smoke path's constraint where src contributors will see it.
- [monitor] smoke-export.mjs counts records by raw CRLF matches and comma-joins the expected header — diverges from csv.ts RFC4180 quoting once labels/fields embed commas or CRLF: switch to a quote-aware record split before any free-text column arc.
- [monitor] smoke-export.mjs line 29 embeds a literal U+FEFF (bytes EF BB BF) instead of '﻿' — formatter/copy-paste can silently corrupt: replace with the escape.
- [monitor] The 10,000 scale lives in 3 places (script assertion, csv:ok contract, charter glossary), independent of SESSION_COUNT — record the full update set for any scale change.
- [monitor] Crash failures exit nonzero WITHOUT the csv:fail prefix — output contract is exit code only; future log-grepping tooling must not assume the prefix.
- [monitor] README Commands is hand-mirrored and already drifts (preview undocumented, pre-existing): document preview or state a gate-plus-dev-loop-only Commands policy.
- [monitor] Unfiltered on:push + pull_request double-runs the job on PR-branch pushes (pre-existing); every appended step doubles in cost: filter push to main.
