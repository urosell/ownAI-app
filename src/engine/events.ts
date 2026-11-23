// Eventos aleatorios (§6). Se comprueban cada 30 s.
import { B } from './balance';
import { clamp } from './formulas';
import { addLog } from './log';
import { chance, pick } from './rng';
import type { GameState } from './state';
import { EVENT_TEXTS } from '../content/events';

type EventId = keyof typeof B.EVENTS | 'ceoFired';
export const EVENT_IDS: EventId[] = [...(Object.keys(B.EVENTS) as (keyof typeof B.EVENTS)[]), 'ceoFired'];

function text(s: GameState, id: string): string {
  return pick(s, EVENT_TEXTS[id] ?? ['Pasa algo.']);
}

function probability(s: GameState, id: EventId): number {
  if (id === 'ceoFired') return 0; // solo la junta
  const e = B.EVENTS[id];
  if (s.phase < e.minPhase) return 0;
  switch (id) {
    case 'lawsuit':
      return s.lawsuitRisk / 100;
    case 'viralPaper':
      return e.p * (s.researchers + s.seniorResearchers);
    case 'jailbreak':
      return e.p * (1 - s.safety);
    default:
      return e.p;
  }
}

export function fireEvent(s: GameState, id: EventId): void {
  switch (id) {
    case 'openWeights':
      dropMarketPrice(s, B.EVENTS.openWeights.priceDrop);
      addLog(s, 'press', text(s, id));
      break;
    case 'gpuShortage':
      s.timed.gpuShortageUntil = s.t + B.EVENTS.gpuShortage.quarters * B.QUARTER_SECONDS;
      addLog(s, 'press', text(s, id));
      break;
    case 'jailbreak':
      s.hype = clamp(s.hype + B.EVENTS.jailbreak.hype, 0, 100);
      addLog(s, 'press', text(s, id));
      break;
    case 'hallucination':
      s.reputation = clamp(s.reputation + B.EVENTS.hallucination.rep, 0, 100);
      s.hype = clamp(s.hype + B.EVENTS.hallucination.hype, 0, 100);
      addLog(s, 'press', text(s, id));
      break;
    case 'lawsuit': {
      const amount = Math.max(0, s.money) * B.LAWSUIT_FINE;
      const settle = Math.max(0, s.money) * B.LAWSUIT_SETTLE;
      addLog(s, 'press', text(s, id));
      s.stats.lawsuits += 1;
      s.modal = { kind: 'lawsuit', amount, settle };
      break;
    }
    case 'viralPaper':
      s.timed.hireDiscountUntil = s.t + B.QUARTER_SECONDS;
      addLog(s, 'success', text(s, id));
      break;
    case 'influencerAgi':
      s.hype = clamp(s.hype + B.EVENTS.influencerAgi.hype, 0, 100);
      s.expectation += B.EVENTS.influencerAgi.expectation;
      addLog(s, 'press', text(s, id));
      break;
    case 'ceoFired':
      s.timed.frozenUntil = s.t + B.CEO_FREEZE;
      s.hype = clamp(s.hype + B.CEO_HYPE, 0, 100);
      addLog(s, 'board', text(s, id));
      break;
  }
  s.eventCooldowns[id] = s.t + (id === 'ceoFired' ? 0 : B.EVENTS[id].cooldown);
}

export function dropMarketPrice(s: GameState, fraction: number): void {
  s.marketPrice = Math.max(B.MARKET_PRICE_MIN, s.marketPrice * (1 - fraction));
}

export function tickEvents(s: GameState, dt: number): void {
  if (s.phase < 1) return;
  s.eventTimer += dt;
  if (s.eventTimer < B.EVENT_INTERVAL) return;
  s.eventTimer -= B.EVENT_INTERVAL;
  for (const id of EVENT_IDS) {
    if ((s.eventCooldowns[id] ?? 0) > s.t) continue;
    const p = probability(s, id);
    if (p > 0 && chance(s, p)) {
      fireEvent(s, id);
      if (s.modal) return; // un modal por comprobación
    }
  }
}
