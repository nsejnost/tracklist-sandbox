# Research: CSV interchange, client download, Node-TS smoke path (ticket 02)

Recorded: 2026-07-29T02:02Z · session 7d94f2a9 · all claims cited to the
primary source read; local probes run on this container (Node v22.22.2, the
same major as CI's Node 22).

## 1 · RFC 4180 rules

Source: https://www.rfc-editor.org/rfc/rfc4180

- Quoting: "Fields containing line breaks (CRLF), double quotes, and commas
  should be enclosed in double-quotes."
- Escaping: "a double-quote appearing inside a field must be escaped by
  preceding it with another double quote."
- Record separator: "Each record is located on a separate line, delimited by a
  line break (CRLF)."
- Header: "There maybe an optional header line appearing as the first line of
  the file with the same format as normal record lines" (presence signaled
  out-of-band via the MIME `header` parameter — invisible in the file itself).
- Trailing newline: "The last record in the file may or may not have an ending
  line break."
- ABNF essence: `file = [header CRLF] record *(CRLF record) [CRLF]`;
  `escaped = DQUOTE *(TEXTDATA / COMMA / CR / LF / 2DQUOTE) DQUOTE`.

## 2 · Spreadsheet-app acceptance of UTF-8 / BOM

Source: https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel

- Microsoft, verbatim: "You can open a CSV file encoded with UTF-8 normally if
  it was saved with BOM (Byte Order Mark)." Without a BOM, Microsoft's page
  routes users through workarounds (Power Query / Text Import Wizard) — i.e.
  double-click open of BOM-less UTF-8 is the documented problem case.
- BOM bytes: EF BB BF; Excel's own "CSV UTF-8" save format writes it.
  (Corroborating: https://learn.microsoft.com/en-us/answers/questions/1642023/excel-is-not-considering-csv-utf-8-bom-file-as-utf)
- Google Sheets and LibreOffice import both BOM and BOM-less UTF-8 (LibreOffice
  shows an import dialog with charset detection); no official page found that
  documents a BOM *breaking* either. No primary source claims harm from a BOM
  in any of the three targets.
- **Local data fact**: the fixture dataset is ASCII-only in every exported
  value (ISO dates, ASCII route names from the `ROUTES` list, formatted
  numbers, effort enum — verified by grep; the single non-ASCII byte in
  fixtures.ts is an em dash in a code comment). Current data also contains no
  commas/quotes/newlines in any formatted cell value, so quoting paths need
  synthetic test inputs to be exercised.

## 3 · Client download path (Blob → object URL → anchor)

Source: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static

- `URL.createObjectURL(blob)` returns a blob: URL referencing the contents;
  "To release an object URL, call revokeObjectURL()." Unreleased URLs hold
  memory for the document's lifetime (the API is banned in service workers
  over exactly this leak risk).
- MDN does NOT document the safe revocation timing relative to an
  anchor-click download; the conservative, commonly-documented-adjacent
  pattern is: trigger the click, then revoke in a later task (e.g.
  setTimeout(0) or after the click handler returns). Flagged for the engine
  decision as "revoke deferred, not synchronous".
- No documented size limits on that page for blob URLs.

## 4 · Main-thread yielding, portable browser + Node

Sources: https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield ·
https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout ·
https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide

- `scheduler.yield()`: purpose-built ("yielding to the main thread during a
  task and continuing execution later") but "not Baseline because it does not
  work in some of the most widely-used browsers", and it is a Web API — not
  Node. → Cannot be the portable primitive; usable only behind
  `globalThis.scheduler?.yield` feature detection.
- `queueMicrotask` / promise chains do NOT yield: microtasks all drain before
  the browser may render or handle input ("processed … after handling events";
  all microtasks complete before rendering; adding microtasks from microtasks
  starves rendering). → Disqualified as the chunk boundary.
- `setTimeout(0)` schedules a macrotask — yields the thread so rendering and
  input can interleave. Clamping fact for chunk sizing: "browsers will enforce
  a minimum timeout of 4 milliseconds once a nested call to setTimeout has
  been scheduled 5 times" (HTML spec via MDN). ⇒ a chunked loop pays ~4 ms per
  chunk after the 5th; chunk count directly sets the floor on total export
  wall time (e.g. 10k rows / 250-row chunks = 40 chunks ≈ ≥160 ms of clamp
  alone; 1000-row chunks ≈ ≥40 ms).
- `setTimeout` exists in both browsers and Node (Node: timers API; probe below
  ran `await new Promise(r => setTimeout(r, 0))` under plain node without
  issue). → The portable yield primitive is a setTimeout(0)-based await,
  optionally upgraded to scheduler.yield when detected.

## 5 · Node 22 TypeScript type stripping (smoke-script mechanism)

Source: https://nodejs.org/docs/latest-v22.x/api/typescript.html · local probe

- Type stripping available since v22.6.0; **enabled by default since
  v22.18.0** (no flag). CI uses Node 22 (charter); this container runs
  v22.22.2 → default-on in both.
- Supported by default: erasable-only syntax (type annotations, interfaces,
  `import type`, inline `type` specifiers). Requires --experimental-transform-types
  instead: enum declarations, namespaces with runtime code, parameter
  properties, import aliases. Decorators unsupported. `.tsx` unsupported.
- "File extensions are mandatory in import statements": `import './file.ts'`.
  `.ts` module system follows package.json `"type"` — tracklist has
  `"type": "module"` → ESM. Type-only imports must use the `type` keyword or
  they become runtime value imports and fail.
- **Local probe (this container, v22.22.2)**: a plain `.mjs` importing a `.ts`
  module (interface + typed const + typed function, `./mod.ts` specifier) ran
  with zero flags → printed `ts-import-ok 84`, exit 0. Mechanism proven for
  `node scripts/smoke-export.mjs` → real `src/export/*.ts` path, provided the
  export module sticks to erasable syntax (the codebase already does: `as
  const` unions, no enums/namespaces/decorators anywhere in src).
- Full-chain caveat for ticket 03: src imports use extension-less specifiers
  (e.g. `from '../types'`) — extension-less resolution is a bundler
  convention; Node type stripping mandates extensions. The prototype must
  verify whether importing `fixtures.ts`/`columns.ts` (which import
  `../types`) works under plain node, or whether the new export module must
  use `.ts`-suffixed specifiers internally and avoid re-exporting through
  extension-less chains. This is the one open mechanism risk.

### 5a · Module-resolution constraint set (verified in-repo, 2026-07-29)

- tsconfig.json (no-touch): `moduleResolution: "bundler"`, `noEmit: true`,
  and **no `allowImportingTsExtensions`** → a `.ts`-suffixed import specifier
  inside `src/` fails `npm run typecheck` (TS5097). The frozen config forces
  src-internal imports to stay extension-less.
- Combined with §5's "extensions are mandatory" under Node: **plain node
  cannot resolve extension-less src-internal value imports.** The two rules
  pinch: src must be extension-less; node needs extensions.
- Graph facts for the smoke path: `src/utils/format.ts` has ZERO imports
  (pure, self-contained). `src/utils/columns.ts` imports `./format`
  (extension-less VALUE import — the single blocking edge) plus type-only
  imports. `src/types.ts` is types + one `as const` array. Type-only imports
  are erased by type stripping before resolution, so modules whose only
  imports are `import type` load cleanly under plain node.
- Consequences (facts, not decisions): (a) an export engine that takes
  `(rows, columns)` as parameters and imports only types loads under plain
  node directly; (b) loading the REAL `columns.ts`/`fixtures.ts` from the
  smoke script hits the extension-less edge; (c) Node offers a no-dependency
  in-process escape: `module.register()` (node:module, stable since ~v20.6,
  documented at https://nodejs.org/docs/latest-v22.x/api/module.html) lets
  `scripts/smoke-export.mjs` register a ~15-line resolve hook that maps the
  repo's extension-less relative specifiers onto their `.ts` files for
  subsequent dynamic imports — keeping the Done-when command exactly
  `node scripts/smoke-export.mjs` with no flags and no deps; (d) alternative:
  the script spawns a child `node --import <hook>` and forwards exit/stdout.
  Ticket 03 must empirically rank (a)+(c)/(d); ticket 04 decides.
