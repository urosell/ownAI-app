// npx tsx src/sim/inspect.ts <semilla> <minuto> — estado del bot en un momento dado (depuración del balance).
import { activeCapability, modelCapability, trainingFlopsPerSecond } from '../engine/formulas';
import { simulate } from './simulate';

const seed = Number(process.argv[2] ?? 1000);
const minutes = Number(process.argv[3] ?? 120);
const r = simulate(seed, minutes);
const s = r.state;
console.log({
  t: (s.t / 60).toFixed(1),
  phase: s.phase,
  money: s.money.toExponential(2),
  active: s.activeModelId,
  activeCap: activeCapability(s).toFixed(2),
  automation: s.automation,
  upgrades: Object.keys(s.upgrades).filter((k) => s.upgrades[k]),
  arch: s.archLevel,
  run: s.currentRun && { status: s.currentRun.status, progress: s.currentRun.progress, C: s.currentRun.C.toExponential(2), target: s.currentRun.targetCapability },
  postRun: s.postRun,
  flops: trainingFlopsPerSecond(s).toExponential(2),
  hearing: s.timed.hearingUntil - s.t,
  compliance: s.compliance,
});
for (const m of s.models.slice(-6)) {
  console.log(m.id, m.name, m.kind, 'base', m.baseCapability.toFixed(2), 'cap', modelCapability(s, m).toFixed(2), 'sft', m.sft, 'rel', m.released, 'eval', m.evaluated, 'N', m.N.toExponential(1), 'D', m.D.toExponential(1));
}
console.log(s.log.slice(0, 12).map((l) => `[${l.type}] ${l.text}`).join('\n'));
