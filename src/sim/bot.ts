// Bot sencillo y codicioso (§11): compra lo más barato que mejora los ingresos,
// entrena cuando P ≥ 50 % y nunca promete.
import { applyInPlace, type Action } from '../engine/actions';
import { B } from '../engine/balance';
import {
  activeCapability,
  annotatorCost,
  annotatorRate,
  apiDemand,
  archCost,
  consumerGpuCost,
  datacenterGpuBatchCost,
  gpuSlots,
  marketingCost,
  maxPretrainTokens,
  modelCapability,
  potentialCapability,
  optimalND,
  ownedGpus,
  powerDemandMW,
  powerSupplyMW,
  promptRate,
  researcherCost,
  seniorCost,
  serviceCapacity,
  totalTokens,
  trainingFlopsPerSecond,
  wrapperUserCapacity,
  wrapperUsersTarget,
} from '../engine/formulas';
import { planFinetune, planPretrain } from '../engine/phases/training';
import { datacenterCost } from '../engine/phases/frontier';
import { canRaise, launchBlockedReason, sftCost } from '../engine/phases/scaleup';
import type { GameState } from '../engine/state';

export const P_THRESHOLD = 0.5;

function act(s: GameState, a: Action) {
  applyInPlace(s, a);
}

function handleModal(s: GameState) {
  const m = s.modal;
  if (!m) return;
  if (m.kind === 'phase') act(s, { type: 'dismissModal' });
  else if (m.kind === 'lawsuit') act(s, { type: 'resolveLawsuit', choice: s.money * 0.2 < s.money - 1000 ? 'settle' : 'pay' });
  else if (m.kind === 'board') act(s, { type: 'boardChoice', choice: m.met ? 'ok' : 'truth' });
}

function buyUpgrades(s: GameState) {
  const order = ['checkpoints', 'monitoring', 'fastNetwork', 'quantization', 'contextCache', 'distillation', 'ownCluster', 'reasoning'];
  for (const id of order) {
    const u = B.UPGRADES[id];
    if (!s.upgrades[id] && s.phase >= u.phase && s.ideas >= u.cost) {
      act(s, { type: 'buyUpgrade', id });
      return;
    }
  }
  if (s.phase >= 2 && s.archLevel < B.ARCH_LEVELS && s.ideas >= archCost(s.archLevel)) act(s, { type: 'buyArchitecture' });
}

function phase0(s: GameState) {
  act(s, { type: 'answerPrompt' });
  const needed = Math.ceil(promptRate(s) / (B.ANNOTATOR_SPEED * (s.templates ? B.TEMPLATES_SPEED_MULT : 1)));
  if (s.annotators < needed && s.money >= annotatorCost(s) + 5) act(s, { type: 'hireAnnotator' });
  if (!s.templates && s.annotators >= 2 && s.money >= B.TEMPLATES_COST + 20) act(s, { type: 'buyTemplates' });
  // Más prompts cuando los anotadores ya cubren todo lo que llega
  if (s.marketing < B.MARKETING_MAX && annotatorRate(s) >= promptRate(s) && s.money >= marketingCost(s) + 20) act(s, { type: 'buyMarketing' });
  if (!s.angelPitched && s.totalEarned >= B.ANGEL_UNLOCK_EARNED) act(s, { type: 'pitchAngels' });
  if (s.money >= B.FIRST_GPU_COST) act(s, { type: 'buyFirstGpu' });
}

function handleRun(s: GameState): boolean {
  const run = s.currentRun;
  if (!run) return false;
  if (run.status === 'failed') {
    if (s.upgrades.checkpoints && s.money >= run.resumeCost) act(s, { type: 'resumeRun' });
    else act(s, { type: 'discardRun' });
  }
  return true;
}

function phase1(s: GameState) {
  if (!s.niche) act(s, { type: 'chooseNiche', niche: 'dentists' });
  if (!s.scraping) act(s, { type: 'setScraping', on: true });
  // Mientras queden prompts, se siguen respondiendo
  act(s, { type: 'answerPrompt' });
  buyUpgrades(s);

  const training = handleRun(s);
  act(s, { type: 'setGpuAlloc', value: training ? 0.7 : 0.1 });

  if (!training) {
    const size = s.gpus.consumer + s.gpus.rented >= B.FT_MODELS.medium.minGpus ? 'medium' : 'small';
    const ablation = s.researchers > 0 ? 0.1 : 0;
    const params = { size, tokens: Math.min(totalTokens(s), 6e8), epochs: 3, ablation } as const;
    const plan = planFinetune(s, { ...params });
    const better = plan.capability > activeCapability(s) + 2;
    // Sin ningún modelo no hay producto: el primero se entrena aunque P < 50 %.
    if (plan.ok && better && (plan.p.p >= P_THRESHOLD || !s.activeModelId) && totalTokens(s) >= 5e7) {
      act(s, { type: 'startFinetune', params: { ...params } });
    }
  }

  // Datos con licencia al principio, para no esperar al scraping
  if (totalTokens(s) < 2e8 && s.money >= B.LICENSED_COST + 300) act(s, { type: 'buyLicensed' });

  // Más capacidad de servicio si los usuarios están limitados por inferencia
  const target = wrapperUsersTarget(s);
  const limited = s.activeModelId && wrapperUserCapacity(s) <= target + 1;
  const net = s.revenuePerSecond - s.costPerSecond;
  // Lo más barato que mejora los ingresos: capacidad de servicio si los usuarios están limitados.
  if (limited && net > B.GPU.rented.rentPerSecond * 2 && s.gpus.rented < 8) act(s, { type: 'rentGpus', delta: 1 });
  if ((limited || s.gpus.consumer < 4) && s.money >= consumerGpuCost(s)) act(s, { type: 'buyConsumerGpu' });
  // Investigadores para llegar a P ≥ 50 %
  if (s.researchers < 3 && s.money >= researcherCost(s) * 1.2) act(s, { type: 'hireResearcher' });
  if (!limited && s.gpus.rented > 0 && net < 0) act(s, { type: 'rentGpus', delta: -1 });
}

function phase2plus(s: GameState) {
  if (!s.scraping) act(s, { type: 'setScraping', on: true });
  buyUpgrades(s);
  act(s, { type: 'setEquity', value: 0.5 });

  const training = handleRun(s);
  act(s, { type: 'setGpuAlloc', value: training || s.postRun ? 0.6 : 0.15 });

  // Post-entrenamiento y lanzamiento
  const best = [...s.models].sort((a, b) => potentialCapability(s, b) - potentialCapability(s, a))[0];
  if (best && best.kind === 'pretrain' && !best.sft && !s.postRun && s.money >= sftCost(best)) {
    act(s, { type: 'startSft', id: best.id });
  } else if (best && !best.released && best.id !== s.activeModelId && modelCapability(s, best) > activeCapability(s) && !launchBlockedReason(s, best)) {
    if (s.phase >= 3 && !best.evaluated && s.compliance < 50 && !s.postRun) act(s, { type: 'evaluateModel', id: best.id });
    else if (!s.postRun || s.postRun.modelId !== best.id) act(s, { type: 'launchModel', id: best.id });
  }

  // Preentrenamiento óptimo: prueba duraciones de 2 a 15 min con el cómputo actual
  if (!training && !s.postRun && !s.automation.autoTrain) {
    const flops = trainingFlopsPerSecond({ ...s, gpuAlloc: 0.6 });
    const ablation = s.researchers + s.seniorResearchers > 0 ? 0.1 : 0;
    const maxN = 10 ** (s.phase >= 3 ? B.PRETRAIN_LOG_N_MAX_P3 : B.PRETRAIN_LOG_N_MAX);
    for (const secs of [120, 300, 600, 900]) {
      const { N, D } = optimalND(flops * secs);
      if (D > maxPretrainTokens(s) || N > maxN || N < 1e9) break;
      const plan = planPretrain(s, { N, D, ablation });
      if (!plan.ok || plan.cost > s.money * 0.5) break;
      if (plan.capability > activeCapability(s) - B.SFT_CAP_BONUS + 2) {
        if (plan.p.p >= P_THRESHOLD) act(s, { type: 'startPretrain', params: { N, D, ablation } });
        break;
      }
    }
  }

  // API: precio según la carga
  const cap = serviceCapacity(s);
  const demand = apiDemand(s);
  if (cap > 0) {
    if (demand > cap * 1.1) act(s, { type: 'setApiPrice', value: s.apiPrice * 1.03 });
    else if (demand < cap * 0.8) act(s, { type: 'setApiPrice', value: Math.max(s.marketPrice * 0.3, s.apiPrice * 0.97) });
  }

  // Contratos
  for (const c of s.contracts) {
    if (!c.accepted && activeCapability(s) >= c.minCapability && cap * 0.8 >= c.tokensPerSecond) act(s, { type: 'acceptContract', id: c.id });
  }

  // Rondas: siempre que se pueda
  if (!canRaise(s)) act(s, { type: 'raiseRound' });

  // Energía y huecos (Fase 3)
  if (s.phase >= 3 && !s.automation.autoBuy) {
    const deficit = powerDemandMW(s) - powerSupplyMW(s) * 0.95;
    const building = s.powerPlants.some((p) => p.buildRemaining > 0);
    if (deficit > 0) {
      if (s.gridMW < B.GRID_MAX_MW) act(s, { type: 'addGrid', mw: B.GRID_STEP_MW });
      else if (!building) act(s, { type: 'buildPlant', kind: s.money > B.NUCLEAR_COST * 1.5 ? 'nuclear' : 'solar' });
    }
    const free = gpuSlots(s) - ownedGpus(s);
    if (free < 1000 && !s.datacenters.some((d) => d.buildRemaining > 0) && s.money > datacenterCost('norway') * 2) {
      act(s, { type: 'buildDatacenter', location: 'norway' });
    }
    if (!s.ownChips && s.chipsRemaining <= 0 && s.money > B.CHIPS_COST * 3) act(s, { type: 'researchChips' });
    if (s.safety < B.END_AGI_SAFETY + 0.05 && s.researchers + s.seniorResearchers >= 6) act(s, { type: 'hireSafetyTeam' });
    if (s.compliance < 35 && s.money > B.LOBBY_COST * 10) act(s, { type: 'lobby' });
    for (const id of ['autoResearch', 'autoTrain', 'autoBuy'] as const) act(s, { type: 'buyAutomation', id });
    if (s.ipoAvailable) act(s, { type: 'goPublic' });
  }

  // GPUs: la compra más barata que mejora los ingresos
  if (!s.automation.autoBuy) {
    const free = gpuSlots(s) - ownedGpus(s);
    for (const n of [1000, 100, 10, 1]) {
      if (n > free) continue;
      const powerOk = s.phase < 3 || powerSupplyMW(s) - powerDemandMW(s) >= (n * B.GPU_KW * B.PUE) / 1000;
      if (powerOk && s.money >= datacenterGpuBatchCost(s, n) * 3) {
        act(s, { type: 'buyDatacenterGpus', n });
        break;
      }
    }
  }

  // Nube: el alquiler no se come más del 40 % de los ingresos
  const rentBudget = (s.revenuePerSecond * 0.4) / B.GPU.rented.rentPerSecond;
  const wantRent = Math.floor(Math.max(0, rentBudget));
  if (wantRent > s.gpus.rented * 1.1 + 10) act(s, { type: 'rentGpus', delta: wantRent - s.gpus.rented });
  else if (wantRent < s.gpus.rented * 0.9) act(s, { type: 'rentGpus', delta: wantRent - s.gpus.rented });

  // Talento
  if (s.money >= seniorCost(s) * 4 && s.seniorResearchers < 40) act(s, { type: 'hireSenior' });
  else if (s.money >= researcherCost(s) * 4 && s.researchers < 20) act(s, { type: 'hireResearcher' });

  // Datos
  if (maxPretrainTokens(s) < 1e13 && s.money >= B.LICENSE_DEAL_P2.cost * 10) act(s, { type: 'buyLicensed' });
}

/** Una decisión del bot (se llama una vez por segundo de juego). */
export function botStep(s: GameState) {
  for (let i = 0; i < 3 && s.modal; i++) handleModal(s);
  if (s.ending || s.modal) return;
  if (s.phase === 0) phase0(s);
  else if (s.phase === 1) phase1(s);
  else phase2plus(s);
  for (let i = 0; i < 3 && s.modal; i++) handleModal(s);
}
