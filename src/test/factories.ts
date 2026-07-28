import type { RunSession } from '../types';

/** Build a session for tests; pass only the fields the test cares about. */
export function makeSession(overrides: Partial<RunSession> & { id: number }): RunSession {
  return {
    date: '2024-06-01',
    routeName: 'Riverside Loop',
    distanceKm: 10,
    durationSec: 3000,
    paceSecPerKm: 300,
    effort: 'easy',
    ...overrides,
  };
}
