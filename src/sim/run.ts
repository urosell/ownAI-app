// npm run sim — juega 20 partidas con el bot y muestra cuánto dura cada fase.
import { simulate, type SimResult } from './simulate';

const SEEDS = Number(process.argv[2] ?? 20);
const TARGETS: [number, number][] = [
  [5, 10],
  [15, 25],
  [30, 45],
  [30, 45],
];

const f = (x: number) => (Number.isFinite(x) ? x.toFixed(1).padStart(6) : '     —');

const results: SimResult[] = [];
const t0 = Date.now();
console.log('semilla   fase 0  fase 1  fase 2  fase 3   total  final          cap.máx');
for (let i = 0; i < SEEDS; i++) {
  const seed = 1000 + i * 7919;
  const r = simulate(seed);
  results.push(r);
  console.log(
    `${String(seed).padStart(7)} ${r.phaseMinutes.map(f).join('  ')}  ${f(r.totalMinutes)}  ${(r.ending ?? '(tiempo)').padEnd(14)} ${r.maxCapability.toFixed(0).padStart(5)}`,
  );
}

function stats(xs: number[]) {
  const v = xs.filter(Number.isFinite);
  if (!v.length) return { mean: NaN, min: NaN, max: NaN };
  return { mean: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v) };
}

console.log('\nResumen (minutos de juego)');
console.log('fase    media   mín.   máx.   objetivo');
for (let p = 0; p < 4; p++) {
  const st = stats(results.map((r) => r.phaseMinutes[p]));
  const [lo, hi] = TARGETS[p];
  const ok = st.mean >= lo && st.mean <= hi ? '✓' : '✗';
  console.log(`${p}     ${f(st.mean)} ${f(st.min)} ${f(st.max)}   ${lo}–${hi} ${ok}`);
}
const tot = stats(results.map((r) => r.totalMinutes));
console.log(`total ${f(tot.mean)} ${f(tot.min)} ${f(tot.max)}   90–150 ${tot.mean >= 90 && tot.mean <= 150 ? '✓' : '✗'}`);
const endings: Record<string, number> = {};
for (const r of results) endings[r.ending ?? '(tiempo)'] = (endings[r.ending ?? '(tiempo)'] ?? 0) + 1;
console.log('finales:', Object.entries(endings).map(([k, v]) => `${k} ×${v}`).join(', '));
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
