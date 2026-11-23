import { B } from './balance';
import { payRunning } from './economy';
import { tickEvents } from './events';
import { clamp, gpuUpkeep, salaries } from './formulas';
import { tickFake } from './phases/fake';
import { tickBenchmark, tickData, tickResearch, tickWrapper } from './phases/garage';
import { tickScaleup } from './phases/scaleup';
import { tickTraining } from './phases/training';
import { tickBoard } from './board';
import { cloneState, type GameState } from './state';

/** Sistemas extra por fase (los registran los módulos de las fases 2 y 3). Devuelven €/s de gasto. */
type System = (s: GameState, dt: number) => number | void;
const systems: System[] = [];
export function registerSystem(fn: System): void {
  systems.push(fn);
}

/** Avanza el estado dt segundos (muta). Úsalo en el simulador; la UI usa `tick`. */
export function tickInPlace(s: GameState, dt: number): GameState {
  if (s.ending || s.modal) return s;
  s.t += dt;
  // Despido y readmisión del CEO: todo congelado.
  if (s.t < s.timed.frozenUntil) return s;

  tickFake(s, dt);
  tickData(s, dt);
  tickResearch(s, dt);
  tickTraining(s, dt);
  let running = salaries(s) + gpuUpkeep(s);
  running += tickWrapper(s, dt);
  tickBenchmark(s, dt);
  running += tickScaleup(s, dt);
  for (const sys of systems) {
    const extra = sys(s, dt);
    if (typeof extra === 'number') running += extra;
    if (s.modal || s.ending) break;
  }

  // Gastos continuos
  payRunning(s, running * dt, dt);

  tickEvents(s, dt);
  if (!s.modal) tickBoard(s, dt);

  // Media móvil de los ingresos recurrentes (todo lo que pasa por `earn`).
  const k = Math.min(1, dt / B.INCOME_EMA_SECONDS);
  s.revenuePerSecond += (s.incomeBuffer / dt - s.revenuePerSecond) * k;
  s.incomeBuffer = 0;
  s.costPerSecond = running;
  s.reputation = clamp(s.reputation, 0, 100);
  s.hype = clamp(s.hype, 0, 100);
  return s;
}

/** Función pura: devuelve un estado nuevo. */
export function tick(state: GameState, dt: number = B.TICK_DT): GameState {
  return tickInPlace(cloneState(state), dt);
}

/** Procesa un intervalo largo en pasos de TICK_DT (máximo MAX_CATCHUP_SECONDS). */
export function advance(state: GameState, seconds: number, cap = B.MAX_CATCHUP_SECONDS): GameState {
  const s = cloneState(state);
  let left = Math.min(seconds, cap);
  while (left > 1e-9) {
    const dt = Math.min(B.TICK_DT, left);
    tickInPlace(s, dt);
    left -= dt;
    if (s.modal || s.ending) break;
  }
  return s;
}
