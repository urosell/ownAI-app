// npx tsx src/sim/trace.ts <semilla> [cada_s] — traza de una partida del bot para ajustar el balance.
import { B } from '../engine/balance';
import { fmt } from '../engine/format';
import { activeCapability, arr, leaderboard, totalTokens } from '../engine/formulas';
import { initialState } from '../engine/state';
import { tickInPlace } from '../engine/tick';
import { botStep } from './bot';

const seed = Number(process.argv[2] ?? 1000);
const every = Number(process.argv[3] ?? 60);
const maxMin = Number(process.argv[4] ?? 300);
const s = initialState(seed);
let next = 0;
let lastLog = 0;
let lastLogId = 0;
while (!s.ending && s.t < maxMin * 60) {
  if (s.t >= next || s.modal) {
    botStep(s);
    next = Math.floor(s.t) + 1;
  }
  tickInPlace(s, B.TICK_DT);
  if (s.t - lastLog >= every) {
    lastLog = s.t;
    const lb = leaderboard(s)
      .map((r) => `${r.you ? '*' : ''}${r.cap.toFixed(0)}`)
      .join('/');
    console.log(
      `${(s.t / 60).toFixed(1).padStart(6)}m F${s.phase} €${fmt(s.money).padStart(9)} rev ${fmt(s.revenuePerSecond).padStart(7)} cost ${fmt(s.costPerSecond).padStart(7)} ` +
        `users ${fmt(s.users).padStart(6)} cap ${activeCapability(s).toFixed(0).padStart(3)} gpu ${s.gpus.consumer}/${s.gpus.datacenter}/${s.gpus.rented} ` +
        `R${s.researchers}+${s.seniorResearchers} ideas ${fmt(s.ideas)} tok ${fmt(totalTokens(s))} ARR ${fmt(arr(s))} V ${fmt(s.valuation)} hype ${s.hype.toFixed(0)} exp ${s.expectation.toFixed(0)} rank ${lb} arch ${s.archLevel} safe ${s.safety.toFixed(2)} run ${s.currentRun ? `${s.currentRun.status} ${(s.currentRun.progress * 100).toFixed(0)}%` : '-'}`,
    );
  }
  const newLogs = s.log.filter((l) => l.id > lastLogId).reverse();
  for (const l of newLogs) if (process.argv.includes('--log')) console.log(`        [${l.type}] ${l.text}`);
  if (s.log[0]) lastLogId = s.log[0].id;
}
console.log('final:', s.ending, 'en', (s.t / 60).toFixed(1), 'min');
