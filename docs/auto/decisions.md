# Decisions — xlsx-export (append-only)

D-#### entries (Type 2 one-liners) and ADR blocks (Type 1) are appended here by
run sessions, newest at the bottom. Format: references/formats.md. Empty at
charter time — every fork so far was pinned in CHARTER.md by the human, so the
ledger is unseeded.

D-0001 | 2026-07-30 | #03 | xlsx string cells use inline strings (t="inlineStr" with <is><t>…</t></is>), not a sharedStrings table | charter §Silence-defaults (smallest reversible; no new dependency) + research note §3 (self-contained per cell, statelessly serializable in the chunked path; sharedStrings remains the reversible upgrade if a future arc adds compression)

D-0002 | 2026-07-30 | #04 | exportXlsx mirrors exportCsv's chunk/yield/options shape as LOCAL copies in xlsx.ts (own `ExportXlsxOptions`, `DEFAULT_CHUNK_SIZE=500`, `yieldToMacrotaskQueue`) rather than importing from csv.ts | charter §No-touch (csv.ts frozen, no import — "mirror the pattern, never import from it") + §Silence-defaults (follow existing convention; smallest reversible). Type 2: reversible, no interface/data-loss risk. NB the async path does the O(rows) build INSIDE the chunk loop (per-chunk buildWorkbook+rowXml) and shares a `packWorkbook` helper with serializeXlsx so bytes stay identical — the literal-but-hollow yield loop was rejected in review as not delivering the charter's "no UI freeze at 10k".
