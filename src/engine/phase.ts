import { addLog } from './log';
import type { GameState, Phase } from './state';
import { PHASE_INTRO } from '../content/text';

type PhaseSetup = (s: GameState) => void;

/** Preparación de cada fase al entrar (la registran los módulos de cada fase). */
export const PHASE_SETUP: Partial<Record<Phase, PhaseSetup>> = {
  1: (s) => {
    if (s.modifiers.includes('twoGpus')) s.gpus.consumer = Math.max(s.gpus.consumer, 2);
  },
};

export function enterPhase(s: GameState, phase: Phase): void {
  if (phase <= s.phase) return;
  s.phase = phase;
  PHASE_SETUP[phase]?.(s);
  const intro = PHASE_INTRO[phase];
  if (intro) addLog(s, 'success', intro);
  s.modal = { kind: 'phase', phase };
}
