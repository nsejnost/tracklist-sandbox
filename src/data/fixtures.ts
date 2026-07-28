import type { Effort, RunSession } from '../types';
import { EFFORTS } from '../types';

export const SESSION_COUNT = 10_000;

const ROUTES = [
  'Riverside Loop',
  'Old Mill Trail',
  'Harbor Esplanade',
  'Cemetery Hill Repeats',
  'Track Intervals',
  'Forest Fire Road',
  'Canal Towpath',
  'Stadium Steps',
  'Ridgeline Traverse',
  'Neighborhood Figure-8',
  'Airport Perimeter',
  'Botanic Gardens Circuit',
] as const;

/**
 * mulberry32 — tiny deterministic PRNG. Same seed, same sequence, every
 * platform. Returns floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 86_400_000;
// Fixed epoch so generated dates never depend on the wall clock.
const FIRST_SESSION_UTC = Date.UTC(2018, 0, 1);

function toIsoDate(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  const item = items[Math.floor(rand() * items.length)];
  if (item === undefined) throw new Error('pick from empty list');
  return item;
}

// Typical pace band per effort, in seconds per km.
const PACE_BAND: Record<Effort, [min: number, max: number]> = {
  easy: [330, 400],
  moderate: [295, 340],
  hard: [255, 300],
  race: [225, 265],
};

/**
 * Generate `count` deterministic running sessions. The default seed produces
 * the canonical fixture set used by the app and the tests; a different seed
 * produces a different (but equally stable) set.
 */
export function generateSessions(count = SESSION_COUNT, seed = 20180101): RunSession[] {
  const rand = mulberry32(seed);
  const sessions: RunSession[] = [];
  let dayCursor = FIRST_SESSION_UTC;
  for (let id = 1; id <= count; id++) {
    // 0-2 rest days between sessions keeps dates increasing but irregular.
    dayCursor += Math.floor(rand() * 3) * DAY_MS;
    const effort = pick(rand, EFFORTS);
    const distanceKm = Math.round((3 + rand() * 18) * 100) / 100;
    const [minPace, maxPace] = PACE_BAND[effort];
    const paceSecPerKm = Math.round(minPace + rand() * (maxPace - minPace));
    sessions.push({
      id,
      date: toIsoDate(dayCursor),
      routeName: pick(rand, ROUTES),
      distanceKm,
      durationSec: Math.round(paceSecPerKm * distanceKm),
      paceSecPerKm,
      effort,
    });
    dayCursor += DAY_MS;
  }
  return sessions;
}
