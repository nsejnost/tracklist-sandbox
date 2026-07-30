# Icebox — xlsx-export (append-only)

Deferred scope and deferred architecture findings. Append-only; run sessions add
to it, the human's next charter harvests it.

- 2026-07-30 | charter | XLSX export — GRADUATED from the icebox into this arc's
  scope. Named a "candidate next arc" in both csv-export §Scope-Out and the
  smoke-gate icebox; now the active arc. Its icebox entries are hereby closed.
- 2026-07-30 | charter | `ExportStatus` inline-union hoist — carried forward,
  still deferred. `'idle' | 'exporting' | 'error'` is written inline in App.tsx
  and Toolbar.tsx instead of a single named type (deviates from the repo's
  as-const string-union convention). This arc's No-touch freezes the model and
  Scope-Out bars refactors beyond the shared export seam, so it stays deferred;
  the xlsx work touches the same status shape, so a future hygiene arc should
  hoist both formats' status to one `export type ExportStatus`. (Origin:
  docs/auto/archive/csv-export/icebox.md, "Worth exploring".)

Other still-open repo-hygiene findings from prior arcs (check-script aggregation,
declared Node floor / engines field, CI push filter to stop double-runs, smoke
robustness — quote-aware split, U+FEFF escape) live in
docs/auto/archive/smoke-gate/icebox.md and are out of this feature arc's scope; a
future hardening arc should harvest them from there.
