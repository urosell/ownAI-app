// Entrenamiento: fine-tuning (Fase 1) y preentrenamiento (Fase 2+). §4.3 y §4.4.
import { B } from '../balance';
import { spend } from '../economy';
import {
  chinchillaLoss,
  clamp,
  computeC,
  currentE,
  dataQuality,
  finetuneCapability,
  maxPretrainTokens,
  modelCapability,
  pretrainCapability,
  pSuccess,
  totalTokens,
  trainingCost,
  trainingFlopsPerSecond,
} from '../formulas';
import { addLog } from '../log';
import { chance, pick, rand, randRange } from '../rng';
import type { FtSize, GameState, Model, RunKind, TrainingRun } from '../state';
import { FAILURES, failureText } from '../../content/failures';

export interface FinetuneParams {
  size: FtSize;
  tokens: number;
  epochs: number;
  ablation: number;
}

export interface PretrainParams {
  N: number;
  D: number;
  ablation: number;
}

export interface RunPlan {
  kind: RunKind;
  N: number;
  D: number;
  epochs: number;
  C: number;
  cost: number;
  p: ReturnType<typeof pSuccess>;
  capability: number;
  ok: boolean;
  reason?: string;
}

/** Las ablaciones solo están disponibles con al menos un investigador. */
export function effectiveAblation(s: GameState, a: number): number {
  return s.researchers + s.seniorResearchers > 0 ? a : 0;
}

export function planFinetune(s: GameState, f: FinetuneParams): RunPlan {
  const m = B.FT_MODELS[f.size];
  const tokens = clamp(f.tokens, 0, totalTokens(s));
  const epochs = clamp(Math.round(f.epochs), 1, 5);
  const ablation = effectiveAblation(s, f.ablation);
  const C = computeC(m.N, tokens * epochs);
  const cost = trainingCost(C, ablation);
  const capability = finetuneCapability(f.size, tokens, epochs, dataQuality(s));
  let reason: string | undefined;
  const gpus = s.gpus.consumer + s.gpus.datacenter + s.gpus.rented;
  if (s.currentRun) reason = 'Ya hay un entrenamiento en marcha.';
  else if (gpus < m.minGpus) reason = `Este modelo necesita ${m.minGpus} GPU${m.minGpus > 1 ? 's' : ''} (por memoria).`;
  else if (tokens <= 0) reason = 'No tienes datos. Activa el scraping o compra un dataset.';
  else if (trainingFlopsPerSecond(s) <= 0) reason = 'No hay GPUs asignadas a entrenamiento.';
  else if (s.money < cost) reason = 'No te llega el dinero.';
  return { kind: 'finetune', N: m.N, D: tokens * epochs, epochs, C, cost, p: pSuccess(s, C * (1 + ablation), ablation), capability, ok: !reason, reason };
}

export function planPretrain(s: GameState, f: PretrainParams): RunPlan {
  const ablation = effectiveAblation(s, f.ablation);
  const C = computeC(f.N, f.D);
  const cost = trainingCost(C, ablation);
  const capability = pretrainCapability(s, f.N, f.D);
  let reason: string | undefined;
  if (s.currentRun) reason = 'Ya hay un entrenamiento en marcha.';
  else if (f.D > maxPretrainTokens(s)) reason = 'No tienes tantos datos (máximo 4 pasadas sobre tu dataset).';
  else if (trainingFlopsPerSecond(s) <= 0) reason = 'No hay GPUs asignadas a entrenamiento.';
  else if (s.money < cost) reason = 'No te llega el dinero.';
  return { kind: 'pretrain', N: f.N, D: f.D, epochs: 1, C, cost, p: pSuccess(s, C * (1 + ablation), ablation), capability, ok: !reason, reason };
}

function rollFailure(s: GameState, run: TrainingRun): void {
  run.willFail = !chance(s, run.pSuccess);
  run.failAt = randRange(s, B.FAIL_AT_MIN, B.FAIL_AT_MAX);
  if (run.willFail) {
    const pool = FAILURES.filter((f) => !f.needsNoMonitoring || !s.upgrades.monitoring);
    run.failureId = pick(s, pool).id;
  } else {
    run.failureId = null;
  }
}

function startRun(s: GameState, plan: RunPlan, ablation: number, ftSize: FtSize | null, modelName: string): void {
  if (!plan.ok || !spend(s, plan.cost)) return;
  const ft = plan.kind === 'finetune';
  // El fine-tune parte de un modelo ya preentrenado: su curva va de la loss del modelo base a la
  // del resultado. El preentrenamiento usa directamente L(N, D_visto).
  const lossFinal = ft ? lossFromCapability(plan.capability) : chinchillaLoss(plan.N, plan.D, currentE(s));
  const lossStart = ft
    ? lossFromCapability(B.FT_MODELS[ftSize ?? 'small'].baseCap) + B.FT_LOSS_START_EXTRA
    : chinchillaLoss(plan.N, Math.max(1e6, plan.D * 0.01), currentE(s));
  const run: TrainingRun = {
    kind: plan.kind,
    modelName,
    N: plan.N,
    D: plan.D,
    epochs: plan.epochs,
    ftSize,
    C: plan.C * (1 + ablation),
    ablation,
    pSuccess: plan.p.p,
    targetCapability: plan.capability,
    progress: 0,
    willFail: false,
    failAt: 1,
    failureId: null,
    status: 'running',
    spent: plan.cost,
    lossPoints: [lossStart],
    lossFinal,
    lossStart,
    resumes: 0,
    resumeCost: 0,
    startedAt: s.t,
  };
  rollFailure(s, run);
  s.currentRun = run;
  s.runsStarted += 1;
  addLog(s, 'info', `Entrenamiento #${s.runsStarted} iniciado: ${modelName}. P(éxito) ${Math.round(run.pSuccess * 100)} %.`);
}

export function startFinetune(s: GameState, f: FinetuneParams): void {
  const plan = planFinetune(s, f);
  const n = s.models.length + 1;
  startRun(s, plan, effectiveAblation(s, f.ablation), f.size, `OwnAI-FT${n}`);
}

export function startPretrain(s: GameState, f: PretrainParams): void {
  const plan = planPretrain(s, f);
  const n = s.models.filter((m) => m.kind === 'pretrain').length + 1;
  startRun(s, plan, effectiveAblation(s, f.ablation), null, `OwnAI-${n}`);
}

function lossFromCapability(cap: number): number {
  return B.L_REF - (cap / 100) * (B.L_REF - B.E_BASE);
}

function lossAt(run: TrainingRun, progress: number, E: number, noise: number): number {
  if (run.kind === 'finetune') {
    const k = B.FT_LOSS_CURVE_K;
    const f = (Math.exp(-k * progress) - Math.exp(-k)) / (1 - Math.exp(-k));
    return (run.lossFinal + (run.lossStart - run.lossFinal) * f) * (1 + noise);
  }
  const seen = Math.max(1e6, run.D * Math.max(0.01, progress));
  return chinchillaLoss(run.N, seen, E) * (1 + noise);
}

export function tickTraining(s: GameState, dt: number): void {
  const run = s.currentRun;
  if (!run || run.status !== 'running') return;
  const flops = trainingFlopsPerSecond(s);
  if (flops <= 0) return;
  const rate = Math.min(flops / run.C, 1 / B.TRAIN_MIN_SECONDS);
  const before = run.progress;
  run.progress = Math.min(1, run.progress + rate * dt);

  // Curva de loss muestreada
  const step = 1 / B.LOSS_POINTS;
  const E = currentE(s);
  while (run.lossPoints.length * step <= run.progress && run.lossPoints.length <= B.LOSS_POINTS) {
    const p = run.lossPoints.length * step;
    if (run.willFail && p >= run.failAt) break;
    run.lossPoints.push(lossAt(run, p, E, (rand(s) * 2 - 1) * B.LOSS_NOISE));
  }

  if (run.willFail && before < run.failAt && run.progress >= run.failAt) {
    run.progress = run.failAt;
    const last = run.lossPoints[run.lossPoints.length - 1] ?? run.lossStart;
    run.lossPoints.push(last * randRange(s, B.LOSS_SPIKE_MIN, B.LOSS_SPIKE_MAX));
    run.status = 'failed';
    run.resumeCost = Math.round(run.spent * randRange(s, B.RESUME_COST_MIN, B.RESUME_COST_MAX));
    s.failedStreak += 1;
    addLog(s, 'fail', `Entrenamiento #${s.runsStarted} fallido: ${failureText(run.failureId)}`);
    return;
  }

  if (run.progress >= 1) finishRun(s, run);
}

function finishRun(s: GameState, run: TrainingRun): void {
  s.currentRun = null;
  s.failedStreak = 0;
  const model: Model = {
    id: `m${s.models.length + 1}`,
    name: run.modelName,
    kind: run.kind,
    N: run.N,
    D: run.D,
    baseCapability: clamp(run.targetCapability, 0, 100),
    sft: false,
    rlhf: null,
    evaluated: false,
    released: false,
    createdAt: s.t,
  };
  s.models.push(model);
  const cap = Math.round(modelCapability(s, model));
  addLog(s, 'success', `${model.name} entrenado. Capacidad ${cap}.`);
  // En Fase 1 el wrapper usa automáticamente el mejor fine-tune.
  if (run.kind === 'finetune' && s.phase <= 1) {
    const cur = s.models.find((m) => m.id === s.activeModelId);
    if (!cur || modelCapability(s, cur) < modelCapability(s, model)) {
      s.activeModelId = model.id;
      model.released = true;
      s.maxCapability = Math.max(s.maxCapability, modelCapability(s, model));
    }
  }
}

export function resumeRun(s: GameState): void {
  const run = s.currentRun;
  if (!run || run.status !== 'failed' || !s.upgrades.checkpoints) return;
  if (!spend(s, run.resumeCost)) return;
  run.spent += run.resumeCost;
  run.resumes += 1;
  run.status = 'running';
  // El pico se queda en la curva como recuerdo. Se vuelve a tirar el dado para el tramo restante.
  run.lossPoints.pop();
  const fail = !chance(s, run.pSuccess);
  run.willFail = fail;
  run.failAt = fail ? randRange(s, run.progress + 0.02, Math.max(run.progress + 0.03, B.FAIL_AT_MAX)) : 1;
  run.failureId = fail ? pick(s, FAILURES.filter((f) => !f.needsNoMonitoring || !s.upgrades.monitoring)).id : null;
  addLog(s, 'info', `Reanudas desde el último checkpoint (${Math.round(run.progress * 100)} %).`);
}

export function discardRun(s: GameState): void {
  if (s.currentRun?.status !== 'failed') return;
  addLog(s, 'info', 'Entrenamiento descartado. Los FLOPs ya no vuelven.');
  s.currentRun = null;
}
