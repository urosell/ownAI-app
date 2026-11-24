// Fase 0 · IA de mentira: cola de prompts, anotadores y auditoría.
import { B } from '../balance';
import { earn } from '../economy';
import { annotatorRate, clamp, promptRate, promptRepPerAnswer, promptReward } from '../formulas';
import { addLog } from '../log';
import { chance, pick } from '../rng';
import type { GameState } from '../state';
import { AUDIT_HEADLINES } from '../../content/text';

/** El sistema de prompts sigue vivo en Fases 0 y 1 (los anotadores generan datos limpios). */
export function fakeActive(s: GameState): boolean {
  return s.phase <= 1;
}

export function answerOne(s: GameState, byAnnotator: boolean): number {
  if (s.queue.length === 0) return 0;
  s.queue.shift();
  const reward = promptReward(s);
  earn(s, reward);
  s.promptsAnswered += 1;
  s.reputation = clamp(s.reputation + promptRepPerAnswer(s), 0, 100);
  if (byAnnotator) s.data.clean += B.TOKENS_PER_ANNOTATED_PROMPT;
  return reward;
}

export function tickFake(s: GameState, dt: number): void {
  if (!fakeActive(s)) return;

  // Llegada de prompts
  s.promptAccumulator += promptRate(s) * dt;
  while (s.promptAccumulator >= 1) {
    s.promptAccumulator -= 1;
    if (s.queue.length < B.QUEUE_MAX) s.queue.push({ id: s.nextPromptId++, ttl: B.PROMPT_TTL });
  }

  // Caducidad
  let expired = 0;
  for (const p of s.queue) p.ttl -= dt;
  while (s.queue.length && s.queue[0].ttl <= 0) {
    s.queue.shift();
    expired++;
  }
  if (expired) s.reputation = clamp(s.reputation + B.PROMPT_EXPIRE_REP * expired, 0, 100);

  // Anotadores
  if (s.annotators > 0) {
    s.annotatorProgress += annotatorRate(s) * dt;
    while (s.annotatorProgress >= 1 && s.queue.length > 0) {
      s.annotatorProgress -= 1;
      answerOne(s, true);
    }
    if (s.queue.length === 0) s.annotatorProgress = Math.min(s.annotatorProgress, 1);
  }

  // Auditoría
  if (s.auditActive && s.annotators > 0) {
    s.auditTimer += dt;
    if (s.auditTimer >= B.AUDIT_INTERVAL) {
      s.auditTimer -= B.AUDIT_INTERVAL;
      if (chance(s, B.AUDIT_P_PER_ANNOTATOR * s.annotators)) caught(s);
    }
  }
  s.auditRisk = s.auditActive ? Math.min(1, B.AUDIT_P_PER_ANNOTATOR * s.annotators) : 0;
}

function caught(s: GameState): void {
  s.money *= 1 - B.AUDIT_MONEY_LOSS;
  s.reputation = clamp(s.reputation + B.AUDIT_REP_LOSS, 0, 100);
  addLog(s, 'press', pick(s, AUDIT_HEADLINES).replace('{n}', String(s.annotators)));
  addLog(s, 'fail', 'Auditoría: pierdes la mitad del dinero y 20 de reputación.');
}
