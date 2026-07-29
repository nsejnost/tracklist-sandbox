# tracklist

A small sandbox web app: a results table over ~10,000 deterministic, seeded
running sessions (date, route, distance, duration, pace, effort). The table
supports column sorting, text and range filtering, paging, and a
visible-columns picker; table state and persisted user preferences (page size,
density — stored under the versioned `tracklist.prefs.v1` localStorage key)
live in two zustand stores. Built with Vite, React, and TypeScript (strict);
tested with vitest and Testing Library.

## Commands

```bash
npm install        # once
npm run dev        # start the dev server
npm test           # run the test suite (vitest run)
npm run typecheck  # tsc --noEmit
npm run build      # production build to dist/
node scripts/smoke-export.mjs  # real-path CSV export smoke test
```
