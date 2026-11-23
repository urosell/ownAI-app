import { B } from './balance';
import { spend } from './economy';
import { annotatorCost, clamp } from './formulas';
import { addLog } from './log';
import { fireEvent } from './events';
import { answerOne } from './phases/fake';
import { cloneState, type GameState, type Phase } from './state';
import { PHASE_INTRO } from '../content/text';

export type Action =
  // generales
  | { type: 'dismissModal' }
  | { type: 'setGpuAlloc'; value: number }
  // fase 0
  | { type: 'answerPrompt' }
  | { type: 'hireAnnotator' }
  | { type: 'buyTemplates' }
  | { type: 'pitchAngels' }
  | { type: 'buyFirstGpu' }
  // debug
  | { type: 'debugMoney'; amount: number }
  | { type: 'debugGpus'; amount: number }
  | { type: 'debugPhase'; phase: Phase }
  | { type: 'debugEvent'; id: string };

type Handler<A extends Action = Action> = (s: GameState, a: A) => void;

const handlers: { [K in Action['type']]: Handler<Extract<Action, { type: K }>> } = {
  dismissModal: (s) => {
    if (s.modal?.kind === 'phase') s.modal = null;
  },
  setGpuAlloc: (s, a) => {
    s.gpuAlloc = clamp(a.value, 0, 1);
  },

  answerPrompt: (s) => {
    answerOne(s, false);
  },
  hireAnnotator: (s) => {
    if (spend(s, annotatorCost(s))) {
      s.annotators += 1;
      if (s.annotators === 1) addLog(s, 'info', 'Primer anotador contratado. A partir de ahora, la "IA" tiene DNI.');
    }
  },
  buyTemplates: (s) => {
    if (!s.templates && spend(s, B.TEMPLATES_COST)) {
      s.templates = true;
      addLog(s, 'info', 'Plantillas de respuesta: "¡Gran pregunta! Como modelo de lenguaje…"');
    }
  },
  pitchAngels: (s) => {
    if (s.angelPitched || s.totalEarned < B.ANGEL_UNLOCK_EARNED) return;
    s.angelPitched = true;
    s.auditActive = true;
    s.money += B.ANGEL_AMOUNT;
    addLog(s, 'success', 'Pitch a inversores ángel: +2.000 €. Ahora hay gente mirando. Cuidado con las auditorías.');
  },
  buyFirstGpu: (s) => {
    if (s.phase !== 0 || !spend(s, B.FIRST_GPU_COST)) return;
    s.gpus.consumer += 1;
    enterPhase(s, 1);
  },

  debugMoney: (s, a) => {
    s.money += a.amount;
  },
  debugGpus: (s, a) => {
    if (s.phase >= 2) s.gpus.datacenter += a.amount;
    else s.gpus.consumer += a.amount;
  },
  debugPhase: (s, a) => {
    while (s.phase < a.phase) enterPhase(s, (s.phase + 1) as Phase);
    s.modal = null;
  },
  debugEvent: (s, a) => {
    fireEvent(s, a.id as Parameters<typeof fireEvent>[1]);
  },
};

export function enterPhase(s: GameState, phase: Phase): void {
  if (phase <= s.phase) return;
  s.phase = phase;
  if (phase === 1 && s.modifiers.includes('twoGpus')) s.gpus.consumer = Math.max(s.gpus.consumer, 2);
  const intro = PHASE_INTRO[phase];
  if (intro) addLog(s, 'success', intro);
  s.modal = { kind: 'phase', phase };
}

/** Aplica una acción (muta). */
export function applyInPlace(s: GameState, a: Action): GameState {
  if (s.ending && a.type !== 'dismissModal') return s;
  (handlers[a.type] as Handler)(s, a);
  return s;
}

/** Función pura. */
export function apply(state: GameState, a: Action): GameState {
  return applyInPlace(cloneState(state), a);
}
