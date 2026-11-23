import { B } from './balance';
import { payRunning } from './economy';
import { clamp, gpuUpkeep, salaries } from './formulas';
import { tickEvents } from './events';
import { tickFake } from './phases/fake';
import { cloneState, type GameState } from './state';

/** Avanza el estado dt segundos (muta). Úsalo en el simulador; la UI usa `tick`. */
export function tickInPlace(s: GameState, dt: number): GameState {
  if (s.ending || s.modal) return s;
  s.t += dt;
  // Despido y readmisión del CEO: todo congelado.
  if (s.t < s.timed.frozenUntil) return s;

  tickFake(s, dt);

  // Gastos continuos
  const running = salaries(s) + gpuUpkeep(s);
  payRunning(s, running * dt, dt);

  tickEvents(s, dt);

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
export function advance(state: GameState, seconds: number): GameState {
  const s = cloneState(state);
  const total = Math.min(seconds, B.MAX_CATCHUP_SECONDS);
  let left = total;
  while (left > 1e-9) {
    const dt = Math.min(B.TICK_DT, left);
    tickInPlace(s, dt);
    left -= dt;
    if (s.modal || s.ending) break;
  }
  return s;
}
