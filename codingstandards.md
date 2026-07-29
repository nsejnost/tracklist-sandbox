# Coding standards — tracklist

Distilled from the existing codebase (2026-07-29). These are the observed
conventions, stated prescriptively: new code follows them; reviews cite them.

## TypeScript

- Strict mode as configured is the floor. No `any`. `noUncheckedIndexedAccess`
  is on — indexed access yields `T | undefined`; handle it, don't assert it away.
- String unions come from `as const` arrays: `const EFFORTS = [...] as const`
  plus `type Effort = (typeof EFFORTS)[number]`. Reuse the array for iteration.
- Type-only imports use `import type { X }` (or inline `type` specifiers in a
  mixed import). Relative import specifiers are extension-less inside `src/`.
- Arrays received or exposed without intent to mutate are `readonly T[]`.
- Exported symbols whose behavior isn't obvious from the signature carry a
  short `/** */` JSDoc — format helpers document input→output examples
  (`/** 754 -> "12:34" */`); derived fields state their derivation.

## React

- Function components only, named exports (`export function Button(...)`).
  The app entry `App.tsx` is the sole default export.
- Props are an explicit `export interface XxxProps`; destructure in the
  signature with defaults (`density = 'comfortable'`).
- Presentational components receive everything via props and can render
  without any store (`ResultsTable`). Stores are read in container components
  (`App`, `Toolbar`) via selector hooks.
- Transient page-local state is `useState` in the owning container (the
  `refreshing` / `page` precedent in `App`). State shared across components
  lives in a zustand store — never duplicate one into the other.

## State (zustand)

- Vanilla pattern only: a `createXxxStore(): StoreApi<XxxState>` factory, a
  module-level singleton, and a typed hook wrapper
  `useXxxStore<T>(selector: (s: XxxState) => T): T` over `useStore`.
- Actions are members of the state interface, implemented in the factory with
  `set()` — functional form whenever the update reads previous state.
- Derive, don't duplicate: recompute from the canonical source rather than
  storing a second copy (column order re-derived from `ALL_COLUMN_KEYS`).
- Guard invariants inside actions (`toggleColumn` refuses to hide the last
  visible column) and note them in the interface JSDoc.

## CSS

- Plain CSS in `src/styles.css` only. No CSS-in-JS, no frameworks, no inline
  style objects for styling.
- Flat kebab-case class names (`.toolbar-row`, `.results-table`, `.th-button`);
  variants as suffixed classes (`.btn-primary`, `.density-compact`).
- All colors come from the `:root` custom properties (`--bg`, `--surface`,
  `--border`, `--text`, `--muted`, `--accent`, `--accent-text`). Never
  introduce a hardcoded color or a new token without cause.
- Group rules under `/* Section */` comments; spacing in `rem`.

## Tests (vitest + @testing-library/react)

- Co-located: `Foo.test.tsx` / `foo.test.ts` next to the source file.
- `describe('Unit')` + terse behavioral `it('renders one header per provided
  column')` names; no "should".
- Build rows with `makeSession({ id, ...onlyWhatMatters })` from
  `src/test/factories.ts`; pass only the fields the test cares about.
- Query the accessible tree: `getByRole('columnheader', { name: 'Route' })`,
  `getByRole('button', ...)`. Assert user-visible output as exact strings
  (`'12.34 km'`, `'1:01:01'`) — expected values are independent literals,
  never recomputed via the code under test.
- Callbacks: `vi.fn()` asserted with `toHaveBeenCalledExactlyOnceWith(...)`.
- Test behavior through public seams (props, exported functions, store API) —
  never internals; a refactor that preserves behavior must not break tests.
- No committed `.skip` / `.todo`. Test count only goes up.

## Copy and aria

- en-US, terse sentence case (`No sessions match the current filters.`).
- Precedented aria shapes: `aria-busy` on a busy `Button`, `role="status"`
  with `aria-label` on `Spinner`, `aria-live="polite"` for changing counts,
  `aria-sort` on the sorted column header. Reuse these before inventing.

## General

- No new dependencies, runtime or dev; versions stay pinned.
- Layout under `src/`: `components/` (PascalCase files), `stores/`, `utils/`
  (pure, focused modules, lowercase files), `data/`, `test/`.
- Names say what things are (`paceSecPerKm`, `visibleColumns`); no
  abbreviations that need decoding.
