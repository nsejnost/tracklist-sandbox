import { describe, expect, it } from 'vitest';
import {
  createPrefsStore,
  DEFAULT_PREFS,
  loadPrefs,
  PREFS_STORAGE_KEY,
  PREFS_VERSION,
  type StorageLike,
} from './prefsStore';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('prefsStore persistence', () => {
  it('uses defaults when storage is empty', () => {
    const store = createPrefsStore(fakeStorage());
    expect(store.getState().pageSize).toBe(DEFAULT_PREFS.pageSize);
    expect(store.getState().density).toBe(DEFAULT_PREFS.density);
  });

  it('writes a versioned payload under the versioned key on every change', () => {
    const storage = fakeStorage();
    createPrefsStore(storage).getState().setPageSize(100);
    expect(PREFS_STORAGE_KEY).toBe('tracklist.prefs.v1');
    const raw = storage.data.get(PREFS_STORAGE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!)).toEqual({
      version: PREFS_VERSION,
      prefs: { pageSize: 100, density: 'comfortable' },
    });
  });

  it('rehydrates persisted prefs into a fresh store', () => {
    const storage = fakeStorage();
    const first = createPrefsStore(storage);
    first.getState().setPageSize(25);
    first.getState().setDensity('compact');
    const second = createPrefsStore(storage);
    expect(second.getState().pageSize).toBe(25);
    expect(second.getState().density).toBe('compact');
  });

  it('falls back to defaults on corrupt JSON', () => {
    const storage = fakeStorage({ [PREFS_STORAGE_KEY]: '{not json' });
    expect(loadPrefs(storage)).toEqual(DEFAULT_PREFS);
  });

  it('discards payloads from a different version', () => {
    const stale = JSON.stringify({ version: 0, prefs: { pageSize: 100, density: 'compact' } });
    const storage = fakeStorage({ [PREFS_STORAGE_KEY]: stale });
    expect(loadPrefs(storage)).toEqual(DEFAULT_PREFS);
  });

  it('repairs individually invalid fields instead of trusting them', () => {
    const tampered = JSON.stringify({
      version: PREFS_VERSION,
      prefs: { pageSize: 999, density: 'compact' },
    });
    const storage = fakeStorage({ [PREFS_STORAGE_KEY]: tampered });
    expect(loadPrefs(storage)).toEqual({ pageSize: DEFAULT_PREFS.pageSize, density: 'compact' });
  });

  it('survives a throwing storage by falling back to defaults', () => {
    const store = createPrefsStore({
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(store.getState().pageSize).toBe(DEFAULT_PREFS.pageSize);
    // Writes must not throw either.
    expect(() => store.getState().setDensity('compact')).not.toThrow();
    expect(store.getState().density).toBe('compact');
  });

  it('resetPrefs restores and persists the defaults', () => {
    const storage = fakeStorage();
    const store = createPrefsStore(storage);
    store.getState().setPageSize(100);
    store.getState().setDensity('compact');
    store.getState().resetPrefs();
    expect(store.getState().pageSize).toBe(DEFAULT_PREFS.pageSize);
    expect(store.getState().density).toBe(DEFAULT_PREFS.density);
    expect(JSON.parse(storage.data.get(PREFS_STORAGE_KEY)!)).toEqual({
      version: PREFS_VERSION,
      prefs: DEFAULT_PREFS,
    });
  });
});
