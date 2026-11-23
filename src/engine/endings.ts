// Finales (§8) y prestigio (§10).
import { B } from './balance';
import { activeCapability, activeModel } from './formulas';
import { addLog } from './log';
import type { EndingId, GameState } from './state';
import { ENDINGS } from '../content/endings';

export function papersFor(s: GameState, id: EndingId): number {
  if (s.prestige.endingsSeen.includes(id)) return 0;
  const base = Math.floor(s.maxCapability / B.PAPERS_CAP_DIV) + B.PAPERS_BONUS;
  return s.modifiers.includes('strictRegulation') ? Math.round(base * B.STRICT_REG_PAPERS_MULT) : base;
}

export function triggerEnding(s: GameState, id: EndingId): void {
  if (s.ending) return;
  const papers = papersFor(s, id);
  s.ending = id;
  s.phase = 4;
  s.modal = null;
  s.prestige.papers += papers;
  s.prestige.runs += 1;
  if (!s.prestige.endingsSeen.includes(id)) s.prestige.endingsSeen.push(id);
  const unlock = ENDINGS[id].unlocks;
  if (!s.prestige.unlockedModifiers.includes(unlock)) s.prestige.unlockedModifiers.push(unlock);
  addLog(s, 'board', `Final: ${ENDINGS[id].title}.${papers ? ` +${papers} papers de prestigio.` : ''}`);
}

/** Se comprueban en cada tick a partir de la Fase 2. */
export function checkEndings(s: GameState, dt: number): void {
  if (s.phase < 2 || s.ending) return;
  const released = activeModel(s)?.released;
  const cap = released ? activeCapability(s) : 0;

  if (cap >= B.END_AGI_CAP) {
    triggerEnding(s, s.safety >= B.END_AGI_SAFETY ? 'agi' : 'agiUnsafe');
    return;
  }

  s.bankruptTimer = s.money < 0 ? s.bankruptTimer + dt : 0;
  if (s.bankruptTimer >= B.END_BANKRUPT_SECONDS) {
    triggerEnding(s, cap >= B.END_ACQUIRED_CAP ? 'acquired' : 'shutdown');
    return;
  }

  const bubble = s.expectation > B.END_BUBBLE_RATIO * cap && s.valuation >= B.END_BUBBLE_VALUATION;
  s.bubbleTimer = bubble ? s.bubbleTimer + dt : 0;
  if (s.bubbleTimer >= B.BUBBLE_GRACE_SECONDS) {
    triggerEnding(s, 'bubble');
    return;
  }

  s.ipoAvailable = s.phase === 3 && s.valuation >= B.END_IPO_VALUATION && s.board.profitStreak >= B.END_IPO_PROFIT_QUARTERS;
}

export function goPublic(s: GameState): void {
  if (s.ipoAvailable) triggerEnding(s, 'ipo');
}
