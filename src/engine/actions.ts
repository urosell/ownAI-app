import { B } from './balance';
import { spend } from './economy';
import { fireEvent } from './events';
import { resolveBoard, type BoardChoice } from './board';
import {
  annotatorCost,
  archCost,
  clamp,
  consumerGpuCost,
  datacenterGpuBatchCost,
  gpuSlots,
  ownedGpus,
  researcherCost,
  trainingFlopsPerSecond,
} from './formulas';
import { addLog } from './log';
import { enterPhase } from './phase';
import { answerOne } from './phases/fake';
import {
  acceptContract,
  hireSenior,
  launchModel,
  promise,
  raiseRound,
  rejectContract,
  startSft,
} from './phases/scaleup';
import { discardRun, resumeRun, startFinetune, startPretrain, type FinetuneParams, type PretrainParams } from './phases/training';
import { cloneState, type GameState, type NicheId, type Phase } from './state';
import { NICHES } from '../content/text';

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
  // fase 1: computación, datos, talento, producto, entrenamiento
  | { type: 'buyConsumerGpu' }
  | { type: 'rentGpus'; delta: number }
  | { type: 'setScraping'; on: boolean }
  | { type: 'setSynthetic'; on: boolean }
  | { type: 'buyLicensed' }
  | { type: 'resolveLawsuit'; choice: 'pay' | 'settle' }
  | { type: 'hireResearcher' }
  | { type: 'buyUpgrade'; id: string }
  | { type: 'buyArchitecture' }
  | { type: 'chooseNiche'; niche: NicheId }
  | { type: 'setContaminate'; on: boolean }
  | { type: 'startFinetune'; params: FinetuneParams }
  | { type: 'startPretrain'; params: PretrainParams }
  | { type: 'resumeRun' }
  | { type: 'discardRun' }
  | { type: 'setActiveModel'; id: string }
  // fase 2
  | { type: 'buyDatacenterGpus'; n: number }
  | { type: 'setApiPrice'; value: number }
  | { type: 'promise' }
  | { type: 'raiseRound' }
  | { type: 'hireSenior' }
  | { type: 'setEquity'; value: number }
  | { type: 'startSft'; id: string }
  | { type: 'setRlhf'; id: string; value: number }
  | { type: 'launchModel'; id: string }
  | { type: 'acceptContract'; id: number }
  | { type: 'rejectContract'; id: number }
  | { type: 'boardChoice'; choice: BoardChoice }
  // debug
  | { type: 'debugMoney'; amount: number }
  | { type: 'debugGpus'; amount: number }
  | { type: 'debugPhase'; phase: Phase }
  | { type: 'debugEvent'; id: string };

type Handler<A extends Action = Action> = (s: GameState, a: A) => void;
type Handlers = { [K in Action['type']]?: Handler<Extract<Action, { type: K }>> };

const handlers: Handlers = {};

/** Registra handlers de acciones (cada módulo de fase añade los suyos). */
export function registerActions(h: Handlers): void {
  Object.assign(handlers, h);
}

registerActions({
  dismissModal: (s) => {
    if (s.modal?.kind === 'phase') s.modal = null;
  },
  setGpuAlloc: (s, a) => {
    s.gpuAlloc = clamp(a.value, 0, 1);
  },

  // ── Fase 0 ──
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

  // ── Fase 1 ──
  buyConsumerGpu: (s) => {
    if (s.phase < 1) return;
    if (spend(s, consumerGpuCost(s))) s.gpus.consumer += 1;
  },
  rentGpus: (s, a) => {
    if (s.phase < 1) return;
    s.gpus.rented = Math.max(0, s.gpus.rented + a.delta);
  },
  setScraping: (s, a) => {
    if (s.phase < 1) return;
    s.scraping = a.on;
  },
  setSynthetic: (s, a) => {
    if (s.upgrades.synthetic) s.syntheticOn = a.on;
  },
  buyLicensed: (s) => {
    if (s.phase < 1) return;
    if (s.phase >= 2) {
      if (spend(s, B.LICENSE_DEAL_P2.cost)) {
        s.data.licensed += B.LICENSE_DEAL_P2.tokens;
        addLog(s, 'info', 'Acuerdo de licencia con un foro enorme. Sus usuarios se enteran por la prensa.');
      }
    } else if (spend(s, B.LICENSED_COST)) {
      s.data.licensed += B.LICENSED_TOKENS;
    }
  },
  resolveLawsuit: (s, a) => {
    if (s.modal?.kind !== 'lawsuit') return;
    const m = s.modal;
    if (a.choice === 'pay') {
      s.money -= m.amount;
      s.lawsuitRisk /= 2;
      addLog(s, 'fail', `Pagas la multa: −${Math.round(m.amount)} €. El riesgo baja a la mitad.`);
    } else {
      s.money -= m.settle;
      s.data.licensed += s.data.scraped;
      s.data.scraped = 0;
      s.lawsuitRisk = 0;
      addLog(s, 'info', 'Acuerdo de licencia: todo lo scrapeado pasa a ser "con licencia". Retroactivamente.');
    }
    s.modal = null;
  },
  hireResearcher: (s) => {
    if (s.phase < 1) return;
    if (spend(s, researcherCost(s))) {
      s.researchers += 1;
      if (s.researchers === 1) addLog(s, 'success', 'Investigadora contratada: cobra en equity y café. Desbloquea las ablaciones.');
    }
  },
  buyUpgrade: (s, a) => {
    const u = B.UPGRADES[a.id];
    if (!u || s.upgrades[a.id] || s.phase < u.phase || s.ideas < u.cost) return;
    s.ideas -= u.cost;
    s.upgrades[a.id] = true;
    addLog(s, 'success', `Mejora investigada: ${UPGRADE_LABEL[a.id] ?? a.id}.`);
  },
  buyArchitecture: (s) => {
    if (s.phase < 2 || s.archLevel >= B.ARCH_LEVELS) return;
    const c = archCost(s.archLevel);
    if (s.ideas < c) return;
    s.ideas -= c;
    s.archLevel += 1;
    addLog(s, 'success', `Nueva arquitectura (nivel ${s.archLevel}): la loss irreducible baja un 3 %. Alguien la llama "Transformer++".`);
  },
  chooseNiche: (s, a) => {
    if (s.phase < 1 || s.niche) return;
    s.niche = a.niche;
    addLog(s, 'info', `Lanzas "${NICHES[a.niche].label}". ${NICHES[a.niche].blurb}`);
  },
  setContaminate: (s, a) => {
    s.benchContaminated = a.on;
    if (a.on) addLog(s, 'info', 'Añades el test set "por error" a los datos de entrenamiento.');
  },
  startFinetune: (s, a) => startFinetune(s, a.params),
  startPretrain: (s, a) => startPretrain(s, a.params),
  resumeRun: (s) => resumeRun(s),
  discardRun: (s) => discardRun(s),
  setActiveModel: (s, a) => {
    const m = s.models.find((x) => x.id === a.id);
    if (m && m.released) s.activeModelId = m.id;
  },

  // ── Fase 2 ──
  buyDatacenterGpus: (s, a) => {
    if (s.phase < 2) return;
    const n = Math.max(0, Math.min(a.n, gpuSlots(s) - ownedGpus(s)));
    if (n > 0 && spend(s, datacenterGpuBatchCost(s, n))) s.gpus.datacenter += n;
  },
  setApiPrice: (s, a) => {
    s.apiPrice = clamp(a.value, 0.1, 100);
  },
  promise: (s) => promise(s),
  raiseRound: (s) => raiseRound(s),
  hireSenior: (s) => hireSenior(s),
  setEquity: (s, a) => {
    s.equityPool = clamp(a.value, 0, 1);
  },
  startSft: (s, a) => startSft(s, a.id, trainingFlopsPerSecond(s)),
  setRlhf: (s, a) => {
    const m = s.models.find((x) => x.id === a.id);
    if (m && m.kind === 'pretrain') m.rlhf = clamp(Math.round(a.value), 0, 100);
  },
  launchModel: (s, a) => launchModel(s, a.id),
  acceptContract: (s, a) => acceptContract(s, a.id),
  rejectContract: (s, a) => rejectContract(s, a.id),
  boardChoice: (s, a) => resolveBoard(s, a.choice),

  // ── Debug ──
  debugMoney: (s, a) => {
    s.money += a.amount;
  },
  debugGpus: (s, a) => {
    if (s.phase >= 2) s.gpus.datacenter += a.amount;
    else s.gpus.consumer += a.amount;
  },
  debugPhase: (s, a) => {
    while (s.phase < a.phase) {
      if (s.phase === 0) s.gpus.consumer = Math.max(1, s.gpus.consumer);
      if (s.phase === 1 && s.money < B.SERIES_A_AMOUNT) s.money += B.SERIES_A_AMOUNT;
      enterPhase(s, (s.phase + 1) as Phase);
    }
    s.modal = null;
  },
  debugEvent: (s, a) => {
    fireEvent(s, a.id as Parameters<typeof fireEvent>[1]);
  },
});

export const UPGRADE_LABEL: Record<string, string> = {
  checkpoints: 'Checkpoints',
  monitoring: 'Monitorización',
  fastNetwork: 'Red rápida',
  quantization: 'Cuantización',
  distillation: 'Destilación',
  contextCache: 'Caché de contexto',
  synthetic: 'Datos sintéticos',
  reasoning: 'Razonamiento',
  ownCluster: 'Cluster propio',
};

/** Aplica una acción (muta). */
export function applyInPlace(s: GameState, a: Action): GameState {
  if (s.ending && a.type !== 'dismissModal') return s;
  const h = handlers[a.type] as Handler | undefined;
  h?.(s, a);
  return s;
}

/** Función pura. */
export function apply(state: GameState, a: Action): GameState {
  return applyInPlace(cloneState(state), a);
}
