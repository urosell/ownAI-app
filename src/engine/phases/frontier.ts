// Fase 3 · Laboratorio frontera: centros de datos, energía, chips, regulación, seguridad y automatización.
import { B } from '../balance';
import { QUARTER_HOOKS } from '../board';
import { spend } from '../economy';
import {
  activeCapability,
  archCost,
  clamp,
  computeC,
  datacenterGpuBatchCost,
  datacenterGpuUnitCost,
  energyCost,
  gpuSlots,
  maxPretrainTokens,
  modelCapability,
  potentialCapability,
  optimalND,
  ownedGpus,
  powerDemandMW,
  powerSupplyMW,
  trainingCost,
  trainingFlopsPerSecond,
} from '../formulas';
import { addLog } from '../log';
import { PHASE_SETUP } from '../phase';
import { chance, pick } from '../rng';
import type { GameState, Model } from '../state';
import { INCIDENT_TEXTS } from '../../content/text';
import { LAUNCH_HOOKS, launchBlockedReason, launchModel, startSft } from './scaleup';
import { discardRun, planPretrain, resumeRun, startPretrain } from './training';
import { money } from '../format';

// ── Entrada en la Fase 3 ─────────────────────────────────

PHASE_SETUP[3] = (s) => {
  // Lo que ya tenías sigue enchufado: contrato de red para la demanda actual y huecos en colocation.
  s.gridMW = Math.ceil(powerDemandMW(s));
  s.colocationSlots = Math.max(B.GARAGE_SLOTS, ownedGpus(s));
  s.safety = Math.max(s.safety, B.SAFETY_BASE);
};

// ── Lanzamientos: regulación e incidentes ────────────────

LAUNCH_HOOKS.push((s: GameState, m: Model) => {
  s.stats.launches += 1;
  if (s.phase < 3) return;
  if (!m.evaluated) {
    s.compliance = clamp(s.compliance + B.COMPLIANCE_LAUNCH_NO_EVAL, 0, 100);
    addLog(s, 'info', `Lanzas ${m.name} sin evaluación previa. Cumplimiento normativo ${B.COMPLIANCE_LAUNCH_NO_EVAL}.`);
  }
  if (chance(s, B.INCIDENT_P * (1 - s.safety))) {
    s.hype = clamp(s.hype + B.INCIDENT_HYPE, 0, 100);
    s.compliance = clamp(s.compliance + B.INCIDENT_COMPLIANCE, 0, 100);
    s.stats.incidents += 1;
    addLog(s, 'press', pick(s, INCIDENT_TEXTS));
  }
  if (s.compliance < B.COMPLIANCE_FINE_THRESHOLD) startHearing(s);
});

function startHearing(s: GameState): void {
  if (s.t < s.timed.hearingUntil) return;
  s.timed.hearingUntil = s.t + B.HEARING_SECONDS;
  addLog(s, 'press', 'Comparecencia en el Parlamento: 6 horas explicando qué es un token. Lanzamientos bloqueados 90 s.');
}

QUARTER_HOOKS.push((s: GameState) => {
  if (s.phase < 3 || s.compliance >= B.COMPLIANCE_FINE_THRESHOLD) return;
  const fine = Math.max(0, s.board.revenueThisQuarter) * B.COMPLIANCE_FINE_FRACTION;
  s.money -= fine;
  addLog(s, 'fail', `Multa del regulador: ${money(fine)} (5 % de los ingresos del trimestre).`);
  startHearing(s);
});

// ── Acciones ─────────────────────────────────────────────

export function datacenterCost(location: string): number {
  const loc = B.LOCATIONS.find((l) => l.id === location);
  return B.DC_COST * (1 - (loc?.subsidy ?? 0));
}

export function buildDatacenter(s: GameState, location: string): void {
  if (s.phase < 3 || !B.LOCATIONS.some((l) => l.id === location)) return;
  if (!spend(s, datacenterCost(location))) return;
  s.datacenters.push({ id: s.nextFacilityId++, location, buildRemaining: B.DC_BUILD_SECONDS });
  const name = B.LOCATIONS.find((l) => l.id === location)!.name;
  addLog(s, 'info', `Empiezas a construir un centro de datos en ${name}. Los vecinos preguntan por el ruido.`);
}

export function addGrid(s: GameState, mw: number): void {
  if (s.phase < 3) return;
  s.gridMW = clamp(s.gridMW + mw, 0, Math.max(B.GRID_MAX_MW, s.gridMW));
}

export function buildPlant(s: GameState, kind: 'solar' | 'nuclear'): void {
  if (s.phase < 3) return;
  const cost = kind === 'solar' ? B.SOLAR_COST : B.NUCLEAR_COST;
  if (!spend(s, cost)) return;
  s.powerPlants.push({
    id: s.nextFacilityId++,
    kind,
    mw: kind === 'solar' ? B.SOLAR_MW : B.NUCLEAR_MW,
    buildRemaining: kind === 'solar' ? B.SOLAR_SECONDS : B.NUCLEAR_SECONDS,
  });
  addLog(s, 'info', kind === 'solar' ? 'Parque solar en obras. Las ovejas siguen pastando debajo.' : 'Reabres una central nuclear. El comunicado dice "energía limpia para la IA limpia".');
}

export function researchChips(s: GameState): void {
  if (s.phase < 3 || s.ownChips || s.chipsRemaining > 0) return;
  if (!spend(s, B.CHIPS_COST)) return;
  s.chipsRemaining = B.CHIPS_SECONDS;
  addLog(s, 'info', 'Empiezas a diseñar tus propios chips. El nombre en clave es "NotAGPU".');
}

export function evalCost(m: Model): number {
  return trainingCost(computeC(m.N, m.D) * B.EVAL_C_FRACTION, 0);
}

export function evaluateModel(s: GameState, id: string): void {
  const m = s.models.find((x) => x.id === id);
  if (!m || m.evaluated || s.postRun || s.phase < 3) return;
  if (!spend(s, evalCost(m))) return;
  s.postRun = { kind: 'eval', modelId: id, remaining: B.EVAL_SECONDS, total: B.EVAL_SECONDS };
  addLog(s, 'info', `Evaluación de ${m.name}: un equipo intenta que diga cosas terribles durante 60 s.`);
}

export function lobby(s: GameState): void {
  if (s.phase < 3 || !spend(s, B.LOBBY_COST)) return;
  if (chance(s, B.LOBBY_SCANDAL_P)) {
    s.hype = clamp(s.hype + B.LOBBY_SCANDAL_HYPE, 0, 100);
    addLog(s, 'press', 'Escándalo: se filtra la cena con el ministro. En el menú había caviar y "regulación ligera".');
  } else {
    s.compliance = clamp(s.compliance + B.LOBBY_COMPLIANCE, 0, 100);
    addLog(s, 'info', 'Lobby discreto. El borrador de la ley ahora dice "voluntario" en lugar de "obligatorio".');
  }
}

export function safetyFromTeams(teams: number): number {
  return clamp(B.SAFETY_BASE + teams * B.SAFETY_PER_TEAM, 0, 1);
}

export function hireSafetyTeam(s: GameState): void {
  if (s.phase < 3) return;
  if (s.researchers + s.seniorResearchers < B.SAFETY_TEAM_COST_RESEARCHERS || s.ideas < B.SAFETY_TEAM_COST_IDEAS) return;
  let left = B.SAFETY_TEAM_COST_RESEARCHERS;
  const r = Math.min(s.researchers, left);
  s.researchers -= r;
  left -= r;
  s.seniorResearchers -= left;
  s.ideas -= B.SAFETY_TEAM_COST_IDEAS;
  s.safetyTeams += 1;
  s.safety = safetyFromTeams(s.safetyTeams);
  addLog(s, 'info', `Equipo de seguridad nº ${s.safetyTeams}. Su primer informe se titula "Por favor, leed esto".`);
}

export function cutSafetyTeam(s: GameState): void {
  if (s.safetyTeams <= 0) return;
  s.safetyTeams -= 1;
  s.researchers += B.SAFETY_TEAM_COST_RESEARCHERS;
  s.safety = safetyFromTeams(s.safetyTeams);
  addLog(s, 'press', 'Recortas un equipo de seguridad. Tres de sus miembros publican una carta abierta.');
}

export function buyAutomation(s: GameState, id: keyof GameState['automation']): void {
  if (s.phase < 3 || s.automation[id] || activeCapability(s) < B.AUTOMATION_CAP) return;
  const c = B.AUTOMATION_COST[id];
  if (s.ideas < c) return;
  s.ideas -= c;
  s.automation[id] = true;
  const txt = {
    autoTrain: 'El modelo ya planifica sus propios entrenamientos. El panel de preentrenamiento desaparece.',
    autoBuy: 'El modelo compra GPUs y energía por su cuenta. Los paneles de computación y energía desaparecen.',
    autoResearch: 'El modelo investiga. Ideas ×2. El panel de investigación desaparece.',
  }[id];
  addLog(s, 'success', txt);
}

// ── Automatizaciones ─────────────────────────────────────

function autoTrain(s: GameState): void {
  if (s.currentRun?.status === 'failed') {
    if (s.upgrades.checkpoints && s.money >= s.currentRun.resumeCost) resumeRun(s);
    else discardRun(s);
    return;
  }
  if (s.currentRun || s.postRun) {
    // Sin entrenamiento en marcha, se ocupa del post-entrenamiento y del lanzamiento.
    return;
  }
  const best = [...s.models].sort((a, b) => potentialCapability(s, b) - potentialCapability(s, a))[0];
  if (best && best.kind === 'pretrain' && !best.sft) {
    startSft(s, best.id, trainingFlopsPerSecond(s));
    return;
  }
  if (best && best.sft && !best.released && modelCapability(s, best) > activeCapability(s) && !launchBlockedReason(s, best)) {
    if (!best.evaluated && s.compliance < 50) {
      evaluateModel(s, best.id);
      return;
    }
    launchModel(s, best.id);
    return;
  }
  // Siguiente entrenamiento con la configuración óptima: la duración más corta (2–15 min) que mejore.
  const flops = trainingFlopsPerSecond(s);
  if (flops <= 0) return;
  for (const secs of B.AUTO_TRAIN_DURATIONS) {
    const { N, D } = optimalND(flops * secs);
    if (D > maxPretrainTokens(s) || N > 10 ** B.PRETRAIN_LOG_N_MAX_P3) return;
    const plan = planPretrain(s, { N, D, ablation: 0.1 });
    if (!plan.ok || trainingCost(plan.C, 0.1) > s.money * 0.5) return;
    if (plan.capability + B.SFT_CAP_BONUS > activeCapability(s) + 1) {
      startPretrain(s, { N, D, ablation: 0.1 });
      return;
    }
  }
}

function autoBuy(s: GameState): void {
  // Energía primero, luego huecos, luego GPUs.
  const demand = powerDemandMW(s);
  const supply = powerSupplyMW(s);
  const building = s.powerPlants.some((p) => p.buildRemaining > 0) || s.datacenters.some((d) => d.buildRemaining > 0);
  if (demand > supply * 0.95) {
    if (s.gridMW < B.GRID_MAX_MW) addGrid(s, B.GRID_STEP_MW);
    else if (!building) buildPlant(s, s.money > B.NUCLEAR_COST * 2 ? 'nuclear' : 'solar');
    return;
  }
  const free = gpuSlots(s) - ownedGpus(s);
  if (free < 100 && !building) {
    const best = [...B.LOCATIONS].sort((a, b) => datacenterCost(a.id) * a.energyMult - datacenterCost(b.id) * b.energyMult)[0];
    if (s.money > datacenterCost(best.id) * 2) buildDatacenter(s, best.id);
    return;
  }
  const budget = s.money * B.AUTO_BUY_RESERVE;
  const unit = datacenterGpuUnitCost(s);
  const n = Math.min(free, Math.floor(budget / unit), 1000);
  if (n >= 10 && supply - demand > (n * B.GPU_KW * B.PUE) / 1000) {
    if (spend(s, datacenterGpuBatchCost(s, n))) s.gpus.datacenter += n;
  }
}

function autoResearch(s: GameState): void {
  for (const id of ['checkpoints', 'monitoring', 'fastNetwork', 'ownCluster', 'reasoning', 'quantization', 'contextCache', 'distillation']) {
    const u = B.UPGRADES[id];
    if (!s.upgrades[id] && s.phase >= u.phase && s.ideas >= u.cost) {
      s.ideas -= u.cost;
      s.upgrades[id] = true;
      return;
    }
  }
  if (s.archLevel < B.ARCH_LEVELS && s.ideas >= archCost(s.archLevel)) {
    s.ideas -= archCost(s.archLevel);
    s.archLevel += 1;
  }
}

// ── Tick de la Fase 3 ────────────────────────────────────

export function tickFrontier(s: GameState, dt: number): number {
  if (s.phase < 3) return 0;
  for (const d of s.datacenters) {
    if (d.buildRemaining > 0) {
      d.buildRemaining -= dt;
      if (d.buildRemaining <= 0) addLog(s, 'success', `Centro de datos listo: ${B.DC_SLOTS.toLocaleString('es-ES')} huecos más para GPUs.`);
    }
  }
  for (const p of s.powerPlants) {
    if (p.buildRemaining > 0) {
      p.buildRemaining -= dt;
      if (p.buildRemaining <= 0) addLog(s, 'success', p.kind === 'solar' ? 'Parque solar conectado: +100 MW.' : 'Central nuclear reabierta: +1.000 MW. Los ecologistas no saben si aplaudir.');
    }
  }
  if (s.chipsRemaining > 0) {
    s.chipsRemaining -= dt;
    if (s.chipsRemaining <= 0) {
      s.chipsRemaining = 0;
      s.ownChips = true;
      addLog(s, 'success', 'Tus chips propios salen de fábrica: GPUs −40 % de precio y +25 % de FLOP/s.');
    }
  }
  s.powerMW = powerSupplyMW(s);

  // Las automatizaciones actúan una vez por segundo.
  if (Math.floor(s.t) !== Math.floor(s.t - dt)) {
    if (s.automation.autoResearch) autoResearch(s);
    if (s.automation.autoBuy) autoBuy(s);
    if (s.automation.autoTrain) autoTrain(s);
  }
  return energyCost(s);
}
