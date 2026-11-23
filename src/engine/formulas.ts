import { B } from './balance';
import type { FtSize, GameState, Model } from './state';

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ── Costes ────────────────────────────────────────────────

export function gpuPriceMult(s: GameState): number {
  let m = 1;
  if (s.t < s.timed.gpuShortageUntil) m *= B.GPU_SHORTAGE_MULT;
  if (s.ownChips) m *= B.OWN_CHIPS_PRICE_MULT;
  return m;
}

export function consumerGpuCost(s: GameState): number {
  const g = B.GPU.consumer;
  return Math.round(g.baseCost * g.growth ** s.gpus.consumer * gpuPriceMult(s));
}

/** Cuántas GPUs hacen falta para que el precio suba un 3 %: 1 (como en la spec) sin centros de datos propios. */
export function datacenterPriceStep(s: GameState): number {
  return 1 + s.datacenters.filter((d) => d.buildRemaining <= 0).length * B.DC_PRICE_STEP;
}

/** Precio de la siguiente GPU de datacenter: 30.000 € × 1,03^(n / paso). */
export function datacenterGpuUnitCost(s: GameState, owned = s.gpus.datacenter): number {
  const g = B.GPU.datacenter;
  return g.baseCost * g.growth ** (owned / datacenterPriceStep(s)) * gpuPriceMult(s);
}

export function datacenterGpuBatchCost(s: GameState, n: number): number {
  // Suma geométrica de los n siguientes precios.
  const q = B.GPU.datacenter.growth ** (1 / datacenterPriceStep(s));
  const first = datacenterGpuUnitCost(s);
  return Math.round(n <= 0 ? 0 : first * ((q ** n - 1) / (q - 1)));
}

/** Máximo de GPUs que te alquila la nube (crece con los trimestres). */
export function rentLimit(s: GameState): number {
  const L = B.RENT_LIMIT;
  if (s.phase <= 1) return L.phase1;
  if (s.phase === 2) return L.phase2Base + L.phase2PerQuarter * (s.board.quarter - 1);
  return L.phase3Base + L.phase3PerQuarter * (s.board.quarter - 1);
}

export function annotatorCost(s: GameState): number {
  return Math.round(B.ANNOTATOR_BASE_COST * B.ANNOTATOR_COST_GROWTH ** s.annotators);
}

export function hireMult(s: GameState): number {
  let m = 1 - Math.min(s.prestige.papers, 10) * B.PAPER_HIRE_DISCOUNT;
  if (s.t < s.timed.hireDiscountUntil) m *= 1 - B.VIRAL_PAPER_DISCOUNT;
  return m;
}

export function researcherCost(s: GameState): number {
  return Math.round(B.RESEARCHER_COST * B.RESEARCHER_GROWTH ** s.researchers * hireMult(s));
}

export function seniorCost(s: GameState): number {
  return Math.round(B.SENIOR_COST * B.SENIOR_GROWTH ** s.seniorResearchers * hireMult(s));
}

export function archCost(level: number): number {
  return B.ARCH_BASE_COST * B.ARCH_GROWTH ** level;
}

// ── Computación ──────────────────────────────────────────

export function ownedGpus(s: GameState): number {
  return s.gpus.consumer + s.gpus.datacenter;
}

/** Megavatios que necesitan las GPUs propias (Fase 3). */
export function powerDemandMW(s: GameState): number {
  return (ownedGpus(s) * B.GPU_KW * B.PUE) / 1000;
}

export function powerSupplyMW(s: GameState): number {
  return s.gridMW + s.powerPlants.filter((p) => p.buildRemaining <= 0).reduce((a, p) => a + p.mw, 0);
}

/** Fracción de GPUs propias con energía (solo cuenta en Fase 3). */
export function poweredFraction(s: GameState): number {
  if (s.phase < 3) return 1;
  const d = powerDemandMW(s);
  return d <= 0 ? 1 : clamp(powerSupplyMW(s) / d, 0, 1);
}

/** FLOP/s efectivos totales. */
export function totalFlops(s: GameState): number {
  const chips = s.ownChips ? B.OWN_CHIPS_FLOPS_MULT : 1;
  const owned = (s.gpus.consumer * B.GPU.consumer.flops + s.gpus.datacenter * B.GPU.datacenter.flops) * chips * poweredFraction(s);
  return owned + s.gpus.rented * B.GPU.rented.flops;
}

/** FLOPs de entrenamiento por segundo real (1 s = 1 h de juego). */
export function trainingFlopsPerSecond(s: GameState): number {
  return totalFlops(s) * B.SECONDS_PER_HOUR * B.GAME_HOURS_PER_SECOND * s.gpuAlloc;
}

/** GPUs de inferencia, en equivalentes de GPU de datacenter. */
export function inferenceGpus(s: GameState): number {
  return (totalFlops(s) * (1 - s.gpuAlloc)) / B.GPU.datacenter.flops;
}

export function trainingGpuCount(s: GameState): number {
  return Math.floor((ownedGpus(s) + s.gpus.rented) * s.gpuAlloc + 1e-9);
}

// ── Ley de escalado ──────────────────────────────────────

export function currentE(s: GameState): number {
  return B.CH_E * B.ARCH_E_MULT ** s.archLevel;
}

export function chinchillaLoss(N: number, D: number, E: number = B.CH_E): number {
  return E + B.CH_A / N ** B.CH_ALPHA + B.CH_B / D ** B.CH_BETA;
}

export function capabilityFromLoss(L: number): number {
  return clamp((100 * (B.L_REF - L)) / (B.L_REF - B.E_BASE), 0, 100);
}

export function computeC(N: number, D: number): number {
  return B.FLOPS_PER_PARAM_TOKEN * N * D;
}

/** Reparto óptimo de C (D ≈ 20·N). */
export function optimalND(C: number): { N: number; D: number } {
  const N = Math.sqrt(C / (B.FLOPS_PER_PARAM_TOKEN * B.CHINCHILLA_TOKENS_PER_PARAM));
  return { N, D: N * B.CHINCHILLA_TOKENS_PER_PARAM };
}

export function scalingEfficiency(N: number, D: number, E: number): number {
  // Compara la parte reducible de la loss con la del reparto óptimo de los mismos FLOPs.
  const opt = optimalND(computeC(N, D));
  const reducible = chinchillaLoss(N, D, E) - E;
  const reducibleOpt = chinchillaLoss(opt.N, opt.D, E) - E;
  return clamp(reducibleOpt / reducible, 0, 1);
}

// ── Datos ────────────────────────────────────────────────

export function totalTokens(s: GameState): number {
  const d = s.data;
  return d.clean + d.scraped + d.licensed + d.synthetic;
}

export function dataQuality(s: GameState): number {
  const t = totalTokens(s);
  if (t <= 0) return 1;
  const d = s.data;
  const q = B.QUALITY;
  return (d.clean * q.clean + d.scraped * q.scraped + d.licensed * q.licensed + d.synthetic * q.synthetic) / t;
}

export function syntheticShare(s: GameState): number {
  const t = totalTokens(s);
  return t > 0 ? s.data.synthetic / t : 0;
}

/** Penalización por model collapse (puntos de capacidad). */
export function collapsePenalty(s: GameState): number {
  const excess = Math.max(0, syntheticShare(s) - B.SYNTHETIC_COLLAPSE_THRESHOLD) * 100;
  return excess * B.SYNTHETIC_COLLAPSE_K;
}

export function maxPretrainTokens(s: GameState): number {
  return totalTokens(s) * B.DATA_MAX_REPEAT;
}

export function scrapeRate(s: GameState): number {
  return s.phase >= 2 ? B.SCRAPE_RATE_P2 : B.SCRAPE_RATE;
}

export function lawsuitUnit(s: GameState): number {
  return s.phase >= 2 ? B.LAWSUIT_UNIT_P2 : 1e8;
}

// ── Capacidad ────────────────────────────────────────────

export function finetuneCapability(size: FtSize, tokens: number, epochs: number, quality: number): number {
  const m = B.FT_MODELS[size];
  const f = B.FT_EPOCH_FACTOR[clamp(epochs, 1, 5) - 1];
  return m.baseCap + B.FT_GAIN * (1 - Math.exp(-tokens / B.FT_TOKEN_SCALE)) * f * quality;
}

export function pretrainCapability(s: GameState, N: number, D: number): number {
  const base = capabilityFromLoss(chinchillaLoss(N, D, currentE(s)));
  const reasoning = s.upgrades.reasoning ? B.REASONING_CAP_BONUS : 0;
  const q = dataQuality(s);
  // Datos peores restan un poco (máx. −5 con todo scrapeado).
  const qualityPenalty = (1 - q) * 25;
  return clamp(base + reasoning - qualityPenalty - collapsePenalty(s), 0, 100);
}

/** Capacidad útil de un modelo, tal y como lo ve el mercado. */
export function modelCapability(s: GameState, m: Model): number {
  let c = m.baseCapability + (m.sft ? B.SFT_CAP_BONUS : 0);
  if (s.upgrades.quantization) c += B.OPT.quantization.cap;
  if (s.upgrades.distillation) c += B.OPT.distillation.cap;
  return clamp(c, 0, 100);
}

/** Capacidad que tendrá el modelo cuando se le haga SFT (para decidir qué post-entrenar y lanzar). */
export function potentialCapability(s: GameState, m: Model): number {
  return modelCapability(s, m.kind === 'pretrain' ? { ...m, sft: true } : m);
}

export function activeModel(s: GameState): Model | null {
  return s.models.find((m) => m.id === s.activeModelId) ?? null;
}

export function activeCapability(s: GameState): number {
  const m = activeModel(s);
  return m ? modelCapability(s, m) : 0;
}

export function benchmarkShown(s: GameState): number {
  return activeCapability(s) + (s.benchContaminated ? B.BENCH_CONTAMINATION : 0);
}

export function canLaunch(m: Model): boolean {
  return m.kind === 'finetune' || m.sft;
}

// ── Probabilidad de éxito ────────────────────────────────

export interface PTerm {
  label: string;
  value: number;
}

export function infraBonus(s: GameState): number {
  const u = s.upgrades;
  const n = [u.checkpoints, u.monitoring, u.fastNetwork, u.ownCluster].filter(Boolean).length;
  return Math.min(B.P_INFRA_MAX, n * B.INFRA_BONUS);
}

export function pSuccess(s: GameState, C: number, ablation: number): { p: number; terms: PTerm[] } {
  const terms: PTerm[] = [];
  const phase = Math.max(1, s.phase);
  terms.push({ label: `Base fase ${Math.min(phase, 3)}`, value: B.P_PHASE[phase] });
  const u = s.upgrades;
  const infra: [boolean, string][] = [
    [!!u.checkpoints, 'Checkpoints'],
    [!!u.monitoring, 'Monitorización'],
    [!!u.fastNetwork, 'Red rápida'],
    [!!u.ownCluster, 'Cluster propio'],
  ];
  let infraLeft = B.P_INFRA_MAX;
  for (const [on, label] of infra) {
    if (on && infraLeft > 0) {
      terms.push({ label, value: B.INFRA_BONUS });
      infraLeft -= B.INFRA_BONUS;
    }
  }
  const ai = B.ABLATION_OPTIONS.indexOf(ablation as 0 | 0.05 | 0.1);
  if (ai > 0) terms.push({ label: `Ablaciones ${Math.round(ablation * 100)} %`, value: B.ABLATION_BONUS[ai] });
  const team = Math.min(B.P_TEAM_MAX, s.researchers * B.P_RESEARCHER + s.seniorResearchers * B.P_SENIOR);
  if (team > 0) {
    const n = s.researchers + s.seniorResearchers;
    terms.push({ label: `${n} investigador${n === 1 ? '' : 'es'}`, value: team });
  }
  const learn = Math.min(B.P_FAILURES_MAX, s.failedStreak * B.P_PER_FAILURE);
  if (learn > 0) terms.push({ label: s.failedStreak === 1 ? 'Fallo anterior' : `${s.failedStreak} fallos seguidos`, value: learn });
  const papers = Math.min(B.P_PAPERS_MAX, s.prestige.papers * B.P_PER_PAPER);
  if (papers > 0) terms.push({ label: 'Papers de prestigio', value: papers });
  const size = -B.P_SIZE_K * Math.max(0, Math.log10(Math.max(C, 1)) - B.P_SIZE_LOG_OFFSET);
  if (size < 0) terms.push({ label: 'Tamaño', value: size });
  const raw = terms.reduce((a, t) => a + t.value, 0);
  return { p: clamp(raw, B.P_MIN, B.P_MAX), terms };
}

export function trainingCost(C: number, ablation: number): number {
  return Math.round(B.TRAIN_FIXED_COST + C * (1 + ablation) * B.TRAIN_COST_PER_FLOP);
}

export function trainingDuration(s: GameState, C: number): number {
  const f = trainingFlopsPerSecond(s);
  if (f <= 0) return Infinity;
  return Math.max(B.TRAIN_MIN_SECONDS, C / f);
}

// ── Producto wrapper (Fase 1) ────────────────────────────

/** Usuarios que pueden servir las GPUs de inferencia con el modelo activo. */
export function wrapperUserCapacity(s: GameState): number {
  const m = activeModel(s);
  if (!m) return 0;
  const gpuEq = (totalFlops(s) * (1 - s.gpuAlloc)) / B.GPU.consumer.flops;
  return gpuEq * B.WRAPPER_USERS_PER_GPU * Math.sqrt(1e9 / m.N);
}

export function wrapperUsersTarget(s: GameState): number {
  if (!s.niche || !activeModel(s)) return 0;
  const cap = benchmarkShown(s);
  const t = cap * cap * B.WRAPPER_USERS_K * (1 + s.reputation / 100);
  return Math.min(t, s.phase <= 1 ? wrapperUserCapacity(s) : Infinity);
}

// ── API e inferencia (Fase 2+) ───────────────────────────

export function inferenceEfficiency(s: GameState): number {
  let e = 1;
  if (s.upgrades.quantization) e *= B.OPT.quantization.eff;
  if (s.upgrades.distillation) e *= B.OPT.distillation.eff;
  if (s.upgrades.contextCache) e *= B.OPT.contextCache.eff;
  return e;
}

/** tokens/s que se pueden servir. */
export function serviceCapacity(s: GameState): number {
  const m = activeModel(s);
  if (!m || !m.released) return 0;
  return inferenceGpus(s) * B.TOKENS_PER_GPU * inferenceEfficiency(s) * (B.REF_PARAMS / m.N);
}

export function rlhfDemandFactor(s: GameState): number {
  const m = activeModel(s);
  const x = m?.rlhf ?? B.RLHF_DEFAULT;
  return x > B.RLHF_HIGH ? Math.max(0, 1 - (x - B.RLHF_HIGH) * B.RLHF_DEMAND_PENALTY) : 1;
}

export function hypeMult(s: GameState): number {
  return s.modifiers.includes('bubbleMarket') ? B.BUBBLE_MOD_MULT : 1;
}

export function apiDemand(s: GameState): number {
  const m = activeModel(s);
  if (!m || !m.released || s.phase < 2) return 0;
  const cap = modelCapability(s, m);
  return (
    B.DEMAND_BASE *
    (cap / B.DEMAND_CAP_REF) ** B.DEMAND_CAP_EXP *
    (s.marketPrice / Math.max(0.01, s.apiPrice)) ** B.DEMAND_PRICE_EXP *
    (1 + s.hype / 100) *
    rlhfDemandFactor(s) *
    marketGrowth(s)
  );
}

/** El mercado crece cada trimestre desde la Fase 2. */
export function marketGrowth(s: GameState): number {
  return s.phase >= 2 ? B.MARKET_GROWTH_PER_QUARTER ** (s.board.quarter - 1 + s.board.timer / B.QUARTER_SECONDS) : 1;
}

/** Tokens/s comprometidos con contratos enterprise. */
export function reservedTps(s: GameState): number {
  return s.contracts.filter((c) => c.accepted).reduce((a, c) => a + c.tokensPerSecond, 0);
}

// ── Valoración ───────────────────────────────────────────

export function arr(s: GameState): number {
  return s.revenuePerSecond * B.ARR_SECONDS_PER_YEAR;
}

export function valuationOf(s: GameState): number {
  const a = arr(s);
  const cap = activeModel(s)?.released ? activeCapability(s) : 0;
  return Math.max(0, a * (B.VAL_ARR_BASE + s.hype / B.VAL_ARR_HYPE_DIV) + B.VAL_CAP_K * cap ** B.VAL_CAP_EXP);
}

export function roundAmount(s: GameState): number {
  return B.ROUND_FRACTION * s.valuation * (s.board.truthRoundBonus ? B.BOARD_TRUTH_ROUND_MULT : 1);
}

// ── Rivales ──────────────────────────────────────────────

export function rivalCapability(r: { capMax: number; r: number; t0: number; bornAt: number }, t: number): number {
  return r.capMax / (1 + Math.exp(-r.r * (t - r.bornAt - r.t0)));
}

export function leaderboard(s: GameState): { name: string; cap: number; you: boolean }[] {
  const rows = s.rivals.map((r) => ({ name: r.name, cap: r.releasedCapability, you: false }));
  const mine = activeModel(s)?.released ? activeCapability(s) : 0;
  rows.push({ name: 'OwnAI', cap: mine, you: true });
  return rows.sort((a, b) => b.cap - a.cap);
}

export function myRank(s: GameState): number {
  return leaderboard(s).findIndex((r) => r.you) + 1;
}

// ── Gastos ───────────────────────────────────────────────

export function salaries(s: GameState): number {
  return (
    (s.annotators * B.ANNOTATOR_SALARY +
      s.researchers * B.RESEARCHER_SALARY +
      s.seniorResearchers * B.SENIOR_SALARY) *
    s.board.salaryMult
  );
}

export function gpuUpkeep(s: GameState): number {
  return (
    s.gpus.consumer * B.GPU.consumer.upkeep +
    s.gpus.datacenter * B.GPU.datacenter.upkeep +
    s.gpus.rented * B.GPU.rented.rentPerSecond
  );
}

export function energyPricePerMWh(s: GameState): number {
  const supply = powerSupplyMW(s);
  if (supply <= 0) return B.GRID_PRICE_MWH;
  let cost = s.gridMW * B.GRID_PRICE_MWH;
  for (const p of s.powerPlants) {
    if (p.buildRemaining > 0) continue;
    cost += p.mw * (p.kind === 'solar' ? B.SOLAR_PRICE_MWH : B.NUCLEAR_PRICE_MWH);
  }
  const loc = locationEnergyMult(s);
  return (cost / supply) * loc;
}

function locationEnergyMult(s: GameState): number {
  if (s.datacenters.length === 0) return 1;
  const ms = s.datacenters.map((d) => B.LOCATIONS.find((l) => l.id === d.location)?.energyMult ?? 1);
  return ms.reduce((a, b) => a + b, 0) / ms.length;
}

/** €/s de energía en Fase 3 (1 s real = 1 h → MW consumidos × €/MWh). */
export function energyCost(s: GameState): number {
  if (s.phase < 3) return 0;
  const used = Math.min(powerDemandMW(s), powerSupplyMW(s));
  return used * energyPricePerMWh(s);
}

export function gpuSlots(s: GameState): number {
  if (s.phase < 3) return Infinity;
  const built = s.datacenters.filter((d) => d.buildRemaining <= 0).length;
  return Math.max(B.GARAGE_SLOTS, s.colocationSlots) + built * B.DC_SLOTS;
}

export function ideasPerSecond(s: GameState): number {
  let i = s.researchers * B.RESEARCHER_IDEAS + s.seniorResearchers * B.SENIOR_IDEAS;
  if (s.automation.autoResearch) i *= B.AUTO_RESEARCH_MULT;
  if (s.phase >= 3 && s.safetyTeams === 0) i *= B.SAFETY_CUT_IDEAS_MULT;
  return i;
}

export function promptRate(s: GameState): number {
  return B.PROMPT_RATE_BASE * (1 + s.reputation / B.PROMPT_RATE_REP_DIVISOR);
}

export function annotatorRate(s: GameState): number {
  return s.annotators * B.ANNOTATOR_SPEED * (s.templates ? B.TEMPLATES_SPEED_MULT : 1);
}

export function promptQuality(s: GameState): number {
  return s.templates ? B.TEMPLATES_QUALITY : B.QUALITY_BASE;
}

export function runwayMonths(s: GameState): number {
  const burn = s.costPerSecond - s.revenuePerSecond;
  if (burn <= 0) return Infinity;
  // 1 s = 1 h de juego → meses de 730 h
  return s.money / burn / 730;
}
