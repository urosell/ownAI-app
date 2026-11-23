// Fase 2 · Scale-up: API e inferencia, hype y expectativas, valoración, rondas, talento,
// contratos enterprise, rivales y post-entrenamiento.
import { B } from '../balance';
import { earn, spend } from '../economy';
import { dropMarketPrice } from '../events';
import {
  activeCapability,
  activeModel,
  apiDemand,
  canLaunch,
  clamp,
  computeC,
  hypeMult,
  modelCapability,
  myRank,
  reservedTps,
  rivalCapability,
  roundAmount,
  seniorCost,
  serviceCapacity,
  trainingCost,
  valuationOf,
} from '../formulas';
import { addLog } from '../log';
import { myBoardCapability, QUARTER_HOOKS } from '../board';
import { enterPhase, PHASE_SETUP } from '../phase';
import { chance, pick, rand, randInt, randRange } from '../rng';
import type { Contract, GameState, Model, Rival } from '../state';
import {
  CONTRACT_ASKS,
  CONTRACT_CLIENTS,
  FOUNDED_RIVAL_NAMES,
  LAUNCH_TEXTS,
  NEW_RIVAL_TEXT,
  POACH_TEXTS,
  PROMISES,
  REFUSAL_TEXTS,
  ROUND_TEXTS,
  SCANDAL_RUDE,
  UNDERDELIVER_TEXTS,
} from '../../content/text';
import { fmt, money } from '../format';

// ── Entrada en la Fase 2 ─────────────────────────────────

QUARTER_HOOKS.push(quarterlyPoach, quarterlyRivals, quarterlyContracts);

PHASE_SETUP[2] = (s) => {
  const skip = s.modifiers.includes('oneRivalLess') ? 1 : 0;
  s.rivals = B.RIVALS.slice(0, B.RIVALS.length - skip).map((r, i) => makeRival(s, r, i, false));
  s.board.timer = 0;
  s.board.quarter = 1;
  s.board.lastArr = s.revenuePerSecond * B.ARR_SECONDS_PER_YEAR;
  s.board.revenueThisQuarter = 0;
  s.board.costsThisQuarter = 0;
  s.timed.roundReadyAt = s.t + B.QUARTER_SECONDS;
  s.nextContractQ = 2;
  s.marketPrice = B.MARKET_PRICE_START;
  s.apiPrice = B.API_PRICE_START;
  s.rivalsBorn = s.t;
  // El fine-tune de la Fase 1 sigue en producción y empieza a servir por API.
  s.gpuAlloc = Math.min(s.gpuAlloc, 0.5);
};

function makeRival(s: GameState, r: { id: string; name: string; capMax: number; r: number; t0: number }, i: number, founded: boolean): Rival {
  const rival: Rival = {
    id: r.id,
    name: r.name,
    capMax: r.capMax,
    r: r.r,
    t0: r.t0,
    bornAt: s.t,
    releasedCapability: 0,
    nextReleaseQ: founded ? s.board.quarter + 2 : 1 + i,
    founded,
  };
  rival.releasedCapability = Math.round(rivalCapability(rival, s.t));
  return rival;
}

// ── Lanzamiento de modelos ───────────────────────────────

export function launchBlockedReason(s: GameState, m: Model): string | null {
  if (!canLaunch(m)) return 'Un modelo base sin SFT no sigue instrucciones. Haz SFT primero.';
  if (s.t < s.timed.hearingUntil) return 'Estás en una comparecencia. No puedes lanzar nada.';
  if (s.postRun?.modelId === m.id) return 'Termina antes el post-entrenamiento.';
  return null;
}

export function launchModel(s: GameState, id: string): void {
  const m = s.models.find((x) => x.id === id);
  if (!m || s.phase < 2 || launchBlockedReason(s, m)) return;
  const cap = modelCapability(s, m);
  const gap = Math.max(0, s.expectation - cap);
  s.valuationMult *= Math.max(0.1, 1 - B.LAUNCH_GAP_VALUATION_K * gap);
  s.hype = clamp(s.hype + (cap / B.LAUNCH_HYPE_DIV - gap) * hypeMult(s), 0, 100);
  s.expectation = cap;
  m.released = true;
  s.activeModelId = m.id;
  s.maxCapability = Math.max(s.maxCapability, cap);
  addLog(s, 'success', pick(s, LAUNCH_TEXTS).replace('{name}', m.name).replace('{cap}', String(Math.round(cap))));
  if (gap > 5) addLog(s, 'press', pick(s, UNDERDELIVER_TEXTS).replace('{name}', m.name));
  if (m.rlhf !== null && m.rlhf > B.RLHF_HIGH) addLog(s, 'press', pick(s, REFUSAL_TEXTS));
  LAUNCH_HOOKS.forEach((h) => h(s, m));
}

/** Efectos extra al lanzar (Fase 3: regulación e incidentes). */
export const LAUNCH_HOOKS: ((s: GameState, m: Model) => void)[] = [];

// ── Post-entrenamiento ───────────────────────────────────

export function sftCost(m: Model): number {
  return trainingCost(computeC(m.N, m.D) * B.SFT_C_FRACTION, 0);
}

export function sftDuration(m: Model, flopsPerSecond: number): number {
  return Math.max(B.TRAIN_MIN_SECONDS / 2, flopsPerSecond > 0 ? (computeC(m.N, m.D) * B.SFT_C_FRACTION) / flopsPerSecond : Infinity);
}

export function startSft(s: GameState, id: string, flopsPerSecond: number): void {
  const m = s.models.find((x) => x.id === id);
  if (!m || m.sft || s.postRun || m.kind !== 'pretrain') return;
  if (!spend(s, sftCost(m))) return;
  const total = sftDuration(m, flopsPerSecond);
  if (!Number.isFinite(total)) return;
  s.postRun = { kind: 'sft', modelId: id, remaining: total, total };
  if (m.rlhf === null) m.rlhf = B.RLHF_DEFAULT;
  addLog(s, 'info', `SFT de ${m.name}: miles de ejemplos de "Claro, aquí tienes…".`);
}

export function tickPostRun(s: GameState, dt: number): void {
  const p = s.postRun;
  if (!p) return;
  p.remaining -= dt;
  if (p.remaining > 0) return;
  const m = s.models.find((x) => x.id === p.modelId);
  s.postRun = null;
  if (!m) return;
  if (p.kind === 'sft') {
    m.sft = true;
    addLog(s, 'success', `${m.name} ya sigue instrucciones (capacidad útil +${B.SFT_CAP_BONUS}). Listo para lanzar.`);
  } else {
    m.evaluated = true;
    s.compliance = clamp(s.compliance + B.EVAL_COMPLIANCE, 0, 100);
    addLog(s, 'success', `Evaluación de ${m.name} terminada. El regulador asiente despacio.`);
  }
}

// ── Hype y promesas ──────────────────────────────────────

export function promise(s: GameState): void {
  if (s.phase < 2 || s.t < s.timed.promiseReadyAt) return;
  const text = nextPromiseText(s);
  rand(s); // cambia la semilla para que la siguiente promesa sea otra
  s.hype = clamp(s.hype + B.PROMISE_HYPE * hypeMult(s), 0, 100);
  s.expectation += B.PROMISE_EXPECTATION * hypeMult(s);
  s.timed.promiseReadyAt = s.t + B.PROMISE_COOLDOWN;
  addLog(s, 'press', `En un podcast dices que "${text}". Hype +${B.PROMISE_HYPE}.`);
}

/** La siguiente promesa que se mostrará en el botón (determinista, sin gastar RNG). */
export function nextPromiseText(s: GameState): string {
  return PROMISES[(s.rngSeed >>> 3) % PROMISES.length];
}

// ── Rondas ───────────────────────────────────────────────

export function canRaise(s: GameState): string | null {
  if (s.phase < 2) return 'Aún no.';
  if (s.dilution >= B.ROUND_MAX_DILUTION) return 'Ya no queda empresa que vender.';
  if (s.t < s.timed.roundReadyAt) return `Próxima ronda en ${Math.ceil(s.timed.roundReadyAt - s.t)} s.`;
  if (s.valuation <= 0) return 'Nadie invierte en una valoración de 0 €.';
  return null;
}

export function raiseRound(s: GameState): void {
  if (canRaise(s)) return;
  const amount = roundAmount(s);
  const add = B.ROUND_DILUTION * (1 - s.dilution / 100);
  s.money += amount;
  s.dilution = Math.min(100, s.dilution + add);
  s.board.truthRoundBonus = false;
  const name = B.ROUND_NAMES[Math.min(s.roundsRaised, B.ROUND_NAMES.length - 1)];
  s.roundsRaised += 1;
  s.timed.roundReadyAt = s.t + B.QUARTER_SECONDS;
  addLog(
    s,
    'success',
    pick(s, ROUND_TEXTS).replace('{round}', name).replace('{amount}', money(amount)).replace('{pct}', `${fmt(add, { decimals: 0 })} %`),
  );
}

// ── Talento ──────────────────────────────────────────────

export function hireSenior(s: GameState): void {
  if (s.phase < 2) return;
  if (spend(s, seniorCost(s))) {
    s.seniorResearchers += 1;
    if (s.seniorResearchers === 1) addLog(s, 'success', 'Fichas a una investigadora sénior. Su contrato tiene una cláusula sobre la marca del café.');
  }
}

export function poachProbability(s: GameState): number {
  const n = s.researchers + s.seniorResearchers;
  return clamp(B.POACH_P_BASE * (n / 10) * (1 - s.equityPool) * s.board.poachMult, 0, 1);
}

export function quarterlyPoach(s: GameState): void {
  const n = s.researchers + s.seniorResearchers;
  if (n === 0 || !chance(s, poachProbability(s))) return;
  const frac = randRange(s, B.POACH_MIN, B.POACH_MAX);
  const leave = Math.max(1, Math.round(n * frac));
  let left = leave;
  const fromSenior = Math.min(s.seniorResearchers, Math.round(left * (s.seniorResearchers / n)));
  s.seniorResearchers -= fromSenior;
  left -= fromSenior;
  s.researchers = Math.max(0, s.researchers - left);
  addLog(s, 'fail', pick(s, POACH_TEXTS).replace('{n}', String(leave)));
  if (leave >= B.POACH_RIVAL_THRESHOLD && s.rivals.filter((r) => r.founded).length < B.MAX_FOUNDED_RIVALS) {
    const name = FOUNDED_RIVAL_NAMES[s.rivals.filter((r) => r.founded).length % FOUNDED_RIVAL_NAMES.length];
    const mine = activeCapability(s);
    // Empiezan cerca de tu capacidad actual y crecen rápido.
    const r = B.RIVAL_FOUNDED_R;
    const capMax = B.RIVAL_FOUNDED_CAPMAX;
    const start = clamp(mine - 5, 10, capMax - 1);
    const t0 = Math.log(capMax / start - 1) / r; // cap(0) = start
    s.rivals.push(makeRival(s, { id: `founded${s.rivals.length}`, name, capMax, r, t0 }, s.rivals.length, true));
    addLog(s, 'press', NEW_RIVAL_TEXT.replace('{n}', String(leave)).replace('{name}', name));
  }
}

// ── Rivales ──────────────────────────────────────────────

export function quarterlyRivals(s: GameState): void {
  for (const r of s.rivals) {
    if (s.board.quarter < r.nextReleaseQ) continue;
    const cap = Math.round(rivalCapability(r, s.t));
    if (cap > r.releasedCapability) {
      const frontier = Math.max(myBoardCapability(s), ...s.rivals.map((x) => x.releasedCapability));
      r.releasedCapability = cap;
      const drop = cap > frontier ? B.MARKET_PRICE_DROP : B.MARKET_PRICE_DROP_MINOR;
      dropMarketPrice(s, drop);
      addLog(s, 'press', `${r.name} lanza un modelo nuevo (capacidad ${cap}). El precio de mercado cae un ${Math.round(drop * 100)} %.`);
    }
    r.nextReleaseQ = s.board.quarter + randInt(s, B.RIVAL_RELEASE_Q[0], B.RIVAL_RELEASE_Q[1]);
  }
}

// ── Contratos enterprise ─────────────────────────────────

export function quarterlyContracts(s: GameState): void {
  // Caducan los que terminan
  for (const c of s.contracts) if (c.accepted) c.remaining -= 1;
  const ended = s.contracts.filter((c) => c.accepted && c.remaining <= 0);
  for (const c of ended) addLog(s, 'info', `Termina el contrato con ${c.client.toLowerCase()}. Dicen que "los agentes han funcionado". Nadie lo ha comprobado.`);
  s.contracts = s.contracts.filter((c) => !(c.accepted && c.remaining <= 0));
  if (s.board.quarter < s.nextContractQ) return;
  s.nextContractQ = s.board.quarter + randInt(s, B.CONTRACT_EVERY_MIN_Q, B.CONTRACT_EVERY_MAX_Q);
  const m = activeModel(s);
  if (!m?.released) return;
  const cap = activeCapability(s);
  const capacity = Math.max(serviceCapacity(s), 1e4);
  const tps = Math.round(capacity * randRange(s, B.CONTRACT_TPS_FRACTION[0], B.CONTRACT_TPS_FRACTION[1]));
  const revenue = (tps * s.apiPrice * B.TOKEN_SECONDS_PER_REAL_SECOND * B.CONTRACT_PREMIUM) / 1e6;
  const offer: Contract = {
    id: s.nextLogId,
    client: pick(s, CONTRACT_CLIENTS),
    text: pick(s, CONTRACT_ASKS),
    minCapability: Math.round(clamp(cap + randInt(s, -8, 3), 10, 99)),
    tokensPerSecond: tps,
    revenuePerSecond: revenue,
    remaining: B.CONTRACT_OFFER_TTL,
    accepted: false,
    breached: 0,
  };
  s.contracts.push(offer);
  addLog(s, 'info', `${offer.client} ${offer.text}`);
}

export function acceptContract(s: GameState, id: number): void {
  const c = s.contracts.find((x) => x.id === id && !x.accepted);
  if (!c) return;
  c.accepted = true;
  c.remaining = randInt(s, B.CONTRACT_DURATION_Q[0], B.CONTRACT_DURATION_Q[1]);
  addLog(s, 'success', `Contrato firmado con ${c.client.toLowerCase()}: +${fmt(c.revenuePerSecond)} €/s durante ${c.remaining} trimestres.`);
}

export function rejectContract(s: GameState, id: number): void {
  s.contracts = s.contracts.filter((x) => !(x.id === id && !x.accepted));
}

// ── Tick de la Fase 2+ ───────────────────────────────────

export function tickScaleup(s: GameState, dt: number): number {
  if (s.phase < 2) return 0;
  tickPostRun(s, dt);

  // Ofertas de contrato que caducan
  for (const c of s.contracts) if (!c.accepted) c.remaining -= dt;
  s.contracts = s.contracts.filter((c) => c.accepted || c.remaining > 0);

  // Inferencia
  const capacity = serviceCapacity(s);
  const demand = apiDemand(s);
  const cap = activeCapability(s);
  let penalty = 0;
  let free = capacity;
  for (const c of s.contracts.filter((x) => x.accepted)) {
    const okCap = cap >= c.minCapability;
    const served = okCap ? Math.min(free, c.tokensPerSecond) : 0;
    free -= served;
    const frac = c.tokensPerSecond > 0 ? served / c.tokensPerSecond : 1;
    earn(s, c.revenuePerSecond * frac * dt);
    if (frac < 0.999) {
      const lost = c.revenuePerSecond * (1 - frac);
      penalty += lost * B.CONTRACT_SLA_PENALTY;
      c.breached += lost * B.CONTRACT_SLA_PENALTY * dt;
    }
  }
  const served = Math.min(Math.max(0, free), demand);
  s.servedTps = served + (capacity - Math.max(0, free));
  s.demandTps = demand + reservedTps(s);
  earn(s, (served * s.apiPrice * B.TOKEN_SECONDS_PER_REAL_SECOND * dt) / 1e6);
  const overloaded = demand > Math.max(0, free) * B.LATENCY_OVERLOAD && demand > 0;
  if (overloaded) {
    s.reputation = clamp(s.reputation + B.LATENCY_REP_PER_SECOND * dt, 0, 100);
    if (!s.latencyWarned) {
      s.latencyWarned = true;
      addLog(s, 'fail', 'Latencia disparada: la demanda supera lo que puedes servir. Usuarios viendo un spinner.');
    }
  } else {
    s.latencyWarned = false;
  }

  // Hype, expectativas y valoración
  s.hype = Math.max(0, s.hype - s.hype * B.HYPE_DECAY * dt);
  s.valuationMult += (1 - s.valuationMult) * Math.min(1, B.VALUATION_MULT_RECOVERY * dt);
  s.valuation = valuationOf(s) * s.valuationMult;
  s.stats.peakValuation = Math.max(s.stats.peakValuation, s.valuation);

  // Transición a la Fase 3: top 3 del ranking o V ≥ 1e10 €
  if (s.phase === 2 && !s.modal && (s.valuation >= B.PHASE3_VALUATION || (activeModel(s)?.released && myRank(s) <= B.TOP_N_FOR_PHASE3 && activeCapability(s) > 0))) {
    enterPhase(s, 3);
  }

  // Amabilidad (RLHF) del modelo activo
  const m = activeModel(s);
  if (m?.released && m.rlhf !== null && m.rlhf < B.RLHF_LOW) {
    s.scandalTimer += dt;
    if (s.scandalTimer >= B.RLHF_SCANDAL_INTERVAL) {
      s.scandalTimer -= B.RLHF_SCANDAL_INTERVAL;
      if (chance(s, (B.RLHF_LOW - m.rlhf) / 100)) {
        s.hype = clamp(s.hype - 10, 0, 100);
        s.reputation = clamp(s.reputation - 10, 0, 100);
        addLog(s, 'press', pick(s, SCANDAL_RUDE));
      }
    }
  }
  return penalty;
}

