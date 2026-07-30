# Decisions — xlsx-export (append-only)

D-#### entries (Type 2 one-liners) and ADR blocks (Type 1) are appended here by
run sessions, newest at the bottom. Format: references/formats.md. Empty at
charter time — every fork so far was pinned in CHARTER.md by the human, so the
ledger is unseeded.

D-0001 | 2026-07-30 | #03 | xlsx string cells use inline strings (t="inlineStr" with <is><t>…</t></is>), not a sharedStrings table | charter §Silence-defaults (smallest reversible; no new dependency) + research note §3 (self-contained per cell, statelessly serializable in the chunked path; sharedStrings remains the reversible upgrade if a future arc adds compression)
