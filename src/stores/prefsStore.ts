import { createStore, useStore, type StoreApi } from 'zustand';

/**
 * User preferences, persisted to a versioned localStorage key. All
 * persistence lives in this module: the store hydrates from storage on
 * creation and writes back on every change. Bump PREFS_VERSION when the
 * shape changes; stale or unreadable payloads fall back to defaults.
 */
export const PREFS_STORAGE_KEY = 'tracklist.prefs.v1';
export const PREFS_VERSION = 1;

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = (typeof DENSITIES)[number];

export interface Prefs {
  pageSize: PageSize;
  density: Density;
}

export const DEFAULT_PREFS: Prefs = {
  pageSize: 50,
  density: 'comfortable',
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

interface PersistedPayload {
  version: number;
  prefs: Prefs;
}

function isPageSize(value: unknown): value is PageSize {
  return (PAGE_SIZES as readonly unknown[]).includes(value);
}

function isDensity(value: unknown): value is Density {
  return (DENSITIES as readonly unknown[]).includes(value);
}

export function loadPrefs(storage: StorageLike): Prefs {
  try {
    const raw = storage.getItem(PREFS_STORAGE_KEY);
    if (raw === null) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PersistedPayload> | null;
    if (parsed === null || typeof parsed !== 'object') return DEFAULT_PREFS;
    if (parsed.version !== PREFS_VERSION) return DEFAULT_PREFS;
    const prefs = parsed.prefs;
    if (prefs === null || typeof prefs !== 'object') return DEFAULT_PREFS;
    return {
      pageSize: isPageSize(prefs.pageSize) ? prefs.pageSize : DEFAULT_PREFS.pageSize,
      density: isDensity(prefs.density) ? prefs.density : DEFAULT_PREFS.density,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(storage: StorageLike, prefs: Prefs): void {
  const payload: PersistedPayload = { version: PREFS_VERSION, prefs };
  try {
    storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be full or unavailable; prefs then last for the session only.
  }
}

export interface PrefsState extends Prefs {
  setPageSize: (pageSize: PageSize) => void;
  setDensity: (density: Density) => void;
  resetPrefs: () => void;
}

export function createPrefsStore(storage: StorageLike): StoreApi<PrefsState> {
  const write = (set: (partial: Partial<Prefs>) => void, get: () => PrefsState, patch: Partial<Prefs>) => {
    set(patch);
    const { pageSize, density } = get();
    savePrefs(storage, { pageSize, density });
  };
  return createStore<PrefsState>()((set, get) => ({
    ...loadPrefs(storage),
    setPageSize: (pageSize) => write(set, get, { pageSize }),
    setDensity: (density) => write(set, get, { density }),
    resetPrefs: () => write(set, get, { ...DEFAULT_PREFS }),
  }));
}

export const prefsStore = createPrefsStore(globalThis.localStorage);

export function usePrefsStore<T>(selector: (state: PrefsState) => T): T {
  return useStore(prefsStore, selector);
}
