// THROWAWAY prototype — ticket #02, arc fuzzy-search. Logic prototype (playbook §8): no tests, no polish.
// Design question: does a dependency-free hand-rolled matcher (subsequence + closeness scoring)
// clear charter Priority 3 ("genuine fuzzy ranking, not just substring matching")?
// Semantics fixed by charter §Silence-defaults: case-insensitive; empty query -> full view; ties -> existing order.

// --- Known fixture: route-name-like strings (id = existing sort order) ---
const FIXTURE = [
  { id: 1, name: 'Morning River Loop' },
  { id: 2, name: 'Riverside Run' },
  { id: 3, name: 'Mountain Pass Trail' },
  { id: 4, name: 'Coastal Ridge Route' },
  { id: 5, name: 'Downtown Riverwalk' },
  { id: 6, name: 'Forest Ridge Loop' },
  { id: 7, name: 'Harbor Bridge Circuit' },
  { id: 8, name: 'Meadow Creek Path' },
  { id: 9, name: 'Sunset Coastal Trail' },
  { id: 10, name: 'Old Mill Riverbank' },
];

// --- Hand-rolled matcher: subsequence gate + closeness scoring, case-insensitive ---
// Returns null if not all query chars appear in order; else a score (higher = closer).
function score(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0, first = -1, last = -1, contiguous = 0, wordStart = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (first === -1) first = ti;
      if (last === ti - 1) contiguous += 3;          // adjacent-match bonus
      if (ti === 0 || t[ti - 1] === ' ') wordStart += 5; // start-of-word bonus
      last = ti;
      qi++;
    }
  }
  if (qi < q.length) return null;                    // subsequence gate: not all chars, in order
  const position = Math.max(0, 20 - first);          // earlier first match is better
  const span = last - first + 1;
  const compact = Math.max(0, 15 - (span - q.length)); // tighter match span is better
  return contiguous + wordStart + position + compact;
}

function rankFuzzy(query, rows) {
  return rows
    .map((r) => ({ r, s: score(query, r.name) }))
    .filter((x) => x.s !== null)
    .sort((a, b) => (b.s - a.s) || (a.r.id - b.r.id)) // ties -> existing sort order (id)
    .map((x) => ({ id: x.r.id, name: x.r.name, score: x.s }));
}

// --- Contrast baseline: naive case-insensitive SUBSTRING filter (what "not just substring" must beat) ---
function rankSubstring(query, rows) {
  const q = query.toLowerCase();
  return rows.filter((r) => r.name.toLowerCase().includes(q)).map((r) => ({ id: r.id, name: r.name }));
}

const QUERIES = ['riv', 'rvr', 'mtn', 'cstl', 'ridge', 'loop', 'xyz'];
console.log('=== FIXTURE ===');
for (const r of FIXTURE) console.log(`  #${r.id} ${r.name}`);
for (const query of QUERIES) {
  console.log(`\n=== QUERY "${query}" ===`);
  const fuzzy = rankFuzzy(query, FIXTURE);
  console.log(' fuzzy (hand-roll)  :', fuzzy.length ? fuzzy.map((m) => `#${m.id}(${m.score})`).join(' > ') : '(none)');
  for (const m of fuzzy) console.log(`     #${m.id} [${m.score}] ${m.name}`);
  const sub = rankSubstring(query, FIXTURE);
  console.log(' substring baseline :', sub.length ? sub.map((m) => `#${m.id}`).join(' ') : '(none)');
}

// --- 10k-row feasibility: does a single linear scan stay smooth (charter §Destination: no freeze at 10,000)? ---
const WORDS = ['River', 'Ridge', 'Loop', 'Trail', 'Coastal', 'Mountain', 'Harbor', 'Creek', 'Sunset', 'Old', 'Mill', 'Run', 'Path', 'Route', 'Circuit', 'Meadow', 'Forest', 'Bridge', 'Pass', 'Walk'];
const big = [];
for (let i = 0; i < 10000; i++) {
  const n = `${WORDS[i % WORDS.length]} ${WORDS[(i * 7) % WORDS.length]} ${WORDS[(i * 13) % WORDS.length]}`;
  big.push({ id: i, name: n });
}
const RUNS = 20;
const t0 = process.hrtime.bigint();
let sink = 0;
for (let k = 0; k < RUNS; k++) sink += rankFuzzy('rvr', big).length;
const t1 = process.hrtime.bigint();
const perQueryMs = Number(t1 - t0) / 1e6 / RUNS;
console.log(`\n=== 10k-ROW FEASIBILITY ===`);
console.log(`  rows=${big.length} · runs=${RUNS} · avg per full-scan query = ${perQueryMs.toFixed(2)} ms (matches=${sink / RUNS})`);
