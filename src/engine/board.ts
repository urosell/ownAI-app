// Junta trimestral (§7). Cada 180 s se abre un modal y el juego se pausa.
import { B } from './balance';
import { fireEvent } from './events';
import { activeCapability, activeModel, arr, clamp } from './formulas';
import { fmt, money } from './format';
import { addLog } from './log';
import { pick } from './rng';
import type { GameState } from './state';
import { BOARD_PRAISE } from '../content/text';

export type BoardChoice = 'ok' | 'fake' | 'agi' | 'pivot' | 'layoff' | 'truth';

/** Efectos trimestrales de otros sistemas (rivales, fugas, contratos, multas…). */
export const QUARTER_HOOKS: ((s: GameState) => void)[] = [];

/** ARR de referencia: media de los últimos trimestres, para que un lanzamiento grande no dispare el listón. */
export function arrBaseline(s: GameState): number {
  const recent = s.board.history.slice(-B.BOARD_ARR_WINDOW).map((h) => h.arr);
  if (recent.length === 0) return s.board.lastArr;
  return recent.reduce((a, x) => a + x, 0) / recent.length;
}

/** Ronda puente que daría pivotar ahora: decrece con cada pivote. */
export function pivotAmount(s: GameState): number {
  return B.BOARD_PIVOT_ROUND * s.valuation * B.BOARD_PIVOT_DECAY ** s.board.pivots;
}

export function pivotDilution(s: GameState): number {
  return B.BOARD_PIVOT_DILUTION * (1 - s.dilution / 100);
}

export function boardTargets(s: GameState): { arrTarget: number; capTarget: number } {
  const growth = s.board.patience ? B.PATIENCE_ARR_GROWTH : B.BOARD_ARR_GROWTH;
  const arrTarget = Math.max(growth * arrBaseline(s), B.BOARD_ARR_MIN);
  const leader = Math.max(0, ...s.rivals.map((r) => r.releasedCapability));
  return { arrTarget, capTarget: Math.max(0, leader - B.BOARD_CAP_MARGIN) };
}

export function myBoardCapability(s: GameState): number {
  return activeModel(s)?.released ? activeCapability(s) : 0;
}

export function tickBoard(s: GameState, dt: number): void {
  if (s.phase < 2) return;
  s.board.timer += dt;
  if (s.board.timer >= B.QUARTER_SECONDS) closeQuarter(s);
}

function closeQuarter(s: GameState): void {
  const b = s.board;
  b.timer -= B.QUARTER_SECONDS;
  const { arrTarget, capTarget } = boardTargets(s);
  const arrNow = arr(s);
  const cap = myBoardCapability(s);
  const met = arrNow >= arrTarget && cap >= capTarget;
  const profit = b.revenueThisQuarter - b.costsThisQuarter;
  b.profitStreak = profit > 0 ? b.profitStreak + 1 : 0;
  b.history.push({ quarter: b.quarter, arr: arrNow, met });
  if (b.history.length > 40) b.history.shift();

  // Efectos trimestrales
  for (const h of QUARTER_HOOKS) h(s);
  b.poachMult = 1;
  b.patience = false;

  b.lastArr = arrNow;
  b.revenueThisQuarter = 0;
  b.costsThisQuarter = 0;
  const quarter = b.quarter;
  b.quarter += 1;

  let text: string;
  if (met) {
    s.valuationMult *= 1 + B.BOARD_SUCCESS_VAL;
    b.missedStreak = 0;
    text = pick(s, BOARD_PRAISE);
    addLog(s, 'board', `Junta del T${quarter}: objetivos cumplidos. Valoración +10 %.`);
  } else {
    text = 'No llegas a los objetivos. La junta ya está redactando un correo con muchos "alineemos expectativas". Elige una opción.';
    addLog(s, 'board', `Junta del T${quarter}: objetivos incumplidos.`);
  }
  s.modal = { kind: 'board', quarter, arrTarget, capTarget, arr: arrNow, cap, met, text };
}

export function resolveBoard(s: GameState, choice: BoardChoice): void {
  const m = s.modal;
  if (m?.kind !== 'board') return;
  if (m.met && choice !== 'ok') return;
  if (!m.met && choice === 'ok') return;
  const b = s.board;
  s.modal = null;
  switch (choice) {
    case 'ok':
      return;
    case 'fake':
      s.expectation += B.BOARD_FAKE_EXPECTATION;
      b.missedStreak = 0;
      addLog(s, 'board', 'Maquillas las métricas: "usuarios activos" ahora incluye a quien abrió la web una vez.');
      return;
    case 'agi':
      s.hype = clamp(s.hype + B.BOARD_AGI_HYPE, 0, 100);
      s.expectation += B.BOARD_AGI_EXPECTATION;
      addLog(s, 'board', 'Prometes AGI a la junta. Aplauden. Alguien pregunta "¿para cuándo?". Cambias de tema.');
      break;
    case 'pivot': {
      const amount = pivotAmount(s);
      const dil = pivotDilution(s);
      s.money += amount;
      s.dilution = Math.min(100, s.dilution + dil);
      s.valuationMult *= 1 + B.BOARD_PIVOT_VAL;
      b.pivots += 1;
      s.users = 0;
      addLog(s, 'board', `Pivotas a agentes. Ronda puente de ${money(amount)} a cambio de un ${fmt(dil, { decimals: 1 })} % de la empresa. Los dentistas se quedan sin chatbot.`);
      break;
    }
    case 'layoff': {
      b.salaryMult *= B.BOARD_LAYOFF_SALARY;
      const cutR = Math.round(s.researchers * B.BOARD_LAYOFF_STAFF);
      const cutS = Math.round(s.seniorResearchers * B.BOARD_LAYOFF_STAFF);
      s.researchers -= cutR;
      s.seniorResearchers -= cutS;
      b.poachMult = 2;
      addLog(s, 'board', `Recortas plantilla (${cutR + cutS} personas). El post de LinkedIn habla de "eficiencia" y "familia".`);
      break;
    }
    case 'truth':
      s.valuationMult *= 1 + B.BOARD_TRUTH_VAL;
      b.truthRoundBonus = true;
      b.patience = true;
      b.missedStreak = 0;
      addLog(s, 'board', 'Dices la verdad. Silencio incómodo. Luego, para sorpresa de todos, respeto.');
      return;
  }
  b.missedStreak += 1;
  if (b.missedStreak >= 2) {
    b.missedStreak = 0;
    fireEvent(s, 'ceoFired');
  }
}
