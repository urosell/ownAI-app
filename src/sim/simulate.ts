import { B } from '../engine/balance';
import { initialState, type EndingId, type GameState } from '../engine/state';
import { tickInPlace } from '../engine/tick';
import { botStep } from './bot';

export interface SimResult {
  seed: number;
  phaseMinutes: number[]; // duración de las fases 0–3 en minutos
  totalMinutes: number;
  ending: EndingId | null;
  maxCapability: number;
  state: GameState;
}

/** Juega una partida completa con el bot a velocidad máxima. */
export function simulate(seed: number, maxMinutes = 300): SimResult {
  const s = initialState(seed);
  const phaseStart = [0, NaN, NaN, NaN, NaN];
  let nextDecision = 0;
  const limit = maxMinutes * 60;
  while (!s.ending && s.t < limit) {
    let before = s.phase;
    if (s.t >= nextDecision || s.modal) {
      botStep(s);
      nextDecision = Math.floor(s.t) + 1;
    }
    if (s.phase !== before) phaseStart[s.phase] = s.t;
    before = s.phase;
    tickInPlace(s, B.TICK_DT);
    if (s.phase !== before) phaseStart[s.phase] = s.t;
  }
  const end = s.t;
  const phaseMinutes = [0, 1, 2, 3].map((p) => {
    const a = phaseStart[p];
    const b = [phaseStart[p + 1], end].find((x) => Number.isFinite(x)) ?? end;
    return Number.isFinite(a) ? (b - a) / 60 : NaN;
  });
  return { seed, phaseMinutes, totalMinutes: end / 60, ending: s.ending, maxCapability: s.maxCapability, state: s };
}
