import { B } from './balance';

export type Phase = 0 | 1 | 2 | 3 | 4;
export type LogType = 'info' | 'success' | 'fail' | 'press' | 'board';
export type EndingId = 'agi' | 'agiUnsafe' | 'ipo' | 'acquired' | 'shutdown' | 'bubble';
export type ModifierId = 'twoGpus' | 'oneRivalLess' | 'strictRegulation' | 'bubbleMarket';
export type NicheId = 'dentists' | 'lawyers' | 'astrologers' | 'marketing';
export type FtSize = 'small' | 'medium';
export type RunKind = 'finetune' | 'pretrain';

export interface Prompt {
  id: number;
  ttl: number;
}

export interface Model {
  id: string;
  name: string;
  kind: RunKind;
  N: number;
  D: number;
  /** Capacidad del modelo base (sin SFT ni optimizaciones). */
  baseCapability: number;
  sft: boolean;
  rlhf: number | null;
  evaluated: boolean;
  released: boolean;
  createdAt: number;
}

export interface TrainingRun {
  kind: RunKind;
  modelName: string;
  N: number;
  D: number; // tokens totales vistos (incluye épocas)
  epochs: number;
  ftSize: FtSize | null;
  C: number;
  ablation: number;
  pSuccess: number;
  targetCapability: number;
  progress: number; // 0–1
  willFail: boolean;
  failAt: number;
  failureId: string | null;
  status: 'running' | 'failed';
  spent: number; // € gastados
  lossPoints: number[]; // loss muestreada
  lossFinal: number;
  lossStart: number;
  resumes: number;
  resumeCost: number;
  startedAt: number;
}

export interface PostRun {
  kind: 'sft' | 'eval';
  modelId: string;
  remaining: number;
  total: number;
}

export interface Contract {
  id: number;
  client: string;
  text: string;
  minCapability: number;
  tokensPerSecond: number;
  revenuePerSecond: number;
  remaining: number; // s; si es oferta, segundos para aceptarla
  accepted: boolean;
  breached: number; // € de penalización acumulada
}

export interface Rival {
  id: string;
  name: string;
  capMax: number;
  r: number;
  t0: number;
  bornAt: number;
  releasedCapability: number;
  nextReleaseQ: number;
  founded: boolean;
}

export interface Datacenter {
  id: number;
  location: string;
  buildRemaining: number;
}

export interface PowerPlant {
  id: number;
  kind: 'solar' | 'nuclear';
  mw: number;
  buildRemaining: number;
}

export interface BoardState {
  quarter: number; // trimestre actual (1 = primer trimestre de la Fase 2)
  timer: number; // segundos dentro del trimestre
  lastArr: number; // ARR al cierre del trimestre anterior
  missedStreak: number;
  patience: boolean; // "decir la verdad" la última vez
  truthRoundBonus: boolean;
  poachMult: number; // ×2 tras recortar plantilla
  salaryMult: number;
  revenueThisQuarter: number;
  costsThisQuarter: number;
  profitStreak: number;
  history: { quarter: number; arr: number; met: boolean }[];
}

export type Modal =
  | { kind: 'board'; quarter: number; arrTarget: number; capTarget: number; arr: number; cap: number; met: boolean; text: string }
  | { kind: 'lawsuit'; amount: number; settle: number }
  | { kind: 'phase'; phase: Phase };

export interface LogEntry {
  id: number;
  t: number;
  phase: Phase;
  quarter: number;
  type: LogType;
  text: string;
}

export interface Timed {
  gpuShortageUntil: number;
  hireDiscountUntil: number;
  frozenUntil: number;
  hearingUntil: number;
  promiseReadyAt: number;
  roundReadyAt: number;
}

export interface GameState {
  version: number;
  phase: Phase;
  t: number;
  rngSeed: number;
  money: number;
  totalEarned: number;
  reputation: number;
  hype: number;
  expectation: number;
  valuation: number;
  valuationMult: number; // memoria del mercado: lanzamientos decepcionantes, juntas…
  dilution: number; // % de la empresa que ya no es tuya (0–100)
  // fase 0
  queue: Prompt[];
  nextPromptId: number;
  promptAccumulator: number;
  annotators: number;
  annotatorProgress: number;
  templates: boolean;
  auditActive: boolean;
  auditRisk: number;
  auditTimer: number;
  angelPitched: boolean;
  promptsAnswered: number;
  // compute
  gpus: { consumer: number; datacenter: number; rented: number };
  gpuAlloc: number;
  // datos
  data: { clean: number; scraped: number; licensed: number; synthetic: number };
  scraping: boolean;
  syntheticOn: boolean;
  lawsuitRisk: number;
  // talento
  researchers: number;
  seniorResearchers: number;
  equityPool: number; // 0–1: parte del pool de equity (10 % de la empresa) repartida
  ideas: number;
  safetyTeams: number;
  // modelos
  models: Model[];
  activeModelId: string | null;
  currentRun: TrainingRun | null;
  postRun: PostRun | null;
  failedStreak: number;
  runsStarted: number;
  maxCapability: number;
  // producto
  niche: NicheId | null;
  users: number;
  apiPrice: number;
  marketPrice: number;
  efficiency: number;
  contracts: Contract[];
  nextContractQ: number;
  benchContaminated: boolean;
  benchTimer: number;
  latencyWarned: boolean;
  revenuePerSecond: number; // calculado en el tick (para la UI y la valoración)
  costPerSecond: number;
  servedTps: number;
  demandTps: number;
  // fase 3
  datacenters: Datacenter[];
  powerPlants: PowerPlant[];
  powerMW: number;
  gridMW: number;
  colocationSlots: number; // huecos para GPU fuera de tus centros de datos (Fase 3)
  nextFacilityId: number;
  stats: { failures: number; launches: number; incidents: number; peakValuation: number; lawsuits: number };
  ownChips: boolean;
  chipsRemaining: number; // >0 mientras se investiga
  safety: number;
  compliance: number;
  automation: { autoTrain: boolean; autoBuy: boolean; autoResearch: boolean };
  rivals: Rival[];
  // meta
  upgrades: Record<string, boolean>;
  archLevel: number;
  board: BoardState;
  timed: Timed;
  modal: Modal | null;
  eventTimer: number;
  eventCooldowns: Record<string, number>;
  scandalTimer: number;
  incidentLog: number;
  sentiment: number; // 0–1, sólo para la escena
  roundsRaised: number;
  rivalsBorn: number; // momento (s) en que empezaron los rivales
  bankruptTimer: number;
  unpaidTimer: number;
  incomeBuffer: number; // ingresos recurrentes desde el último tick (para la media de €/s)
  bubbleTimer: number;
  ipoAvailable: boolean;
  log: LogEntry[];
  nextLogId: number;
  ending: EndingId | null;
  modifiers: ModifierId[];
  prestige: { papers: number; runs: number; endingsSeen: EndingId[]; unlockedModifiers: ModifierId[] };
}

export const SAVE_VERSION = 1;

export function initialState(
  seed = Date.now() >>> 0,
  prestige?: GameState['prestige'],
  modifiers: ModifierId[] = [],
): GameState {
  const strict = modifiers.includes('strictRegulation');
  return {
    version: SAVE_VERSION,
    phase: 0,
    t: 0,
    rngSeed: seed >>> 0 || 1,
    money: B.START_MONEY,
    totalEarned: 0,
    reputation: 0,
    hype: 0,
    expectation: 0,
    valuation: 0,
    valuationMult: 1,
    dilution: 0,
    queue: [],
    nextPromptId: 1,
    promptAccumulator: 0.6,
    annotators: 0,
    annotatorProgress: 0,
    templates: false,
    auditActive: false,
    auditRisk: 0,
    auditTimer: 0,
    angelPitched: false,
    promptsAnswered: 0,
    gpus: { consumer: modifiers.includes('twoGpus') ? 2 : 0, datacenter: 0, rented: 0 },
    gpuAlloc: B.DEFAULT_GPU_ALLOC,
    data: { clean: 0, scraped: 0, licensed: 0, synthetic: 0 },
    scraping: false,
    syntheticOn: false,
    lawsuitRisk: 0,
    researchers: 0,
    seniorResearchers: 0,
    equityPool: 0.1,
    ideas: 0,
    safetyTeams: 0,
    models: [],
    activeModelId: null,
    currentRun: null,
    postRun: null,
    failedStreak: 0,
    runsStarted: 0,
    maxCapability: 0,
    niche: null,
    users: 0,
    apiPrice: B.API_PRICE_START,
    marketPrice: B.MARKET_PRICE_START,
    efficiency: 1,
    contracts: [],
    nextContractQ: 2,
    benchContaminated: false,
    benchTimer: 0,
    latencyWarned: false,
    revenuePerSecond: 0,
    costPerSecond: 0,
    servedTps: 0,
    demandTps: 0,
    datacenters: [],
    powerPlants: [],
    powerMW: 0,
    gridMW: 0,
    colocationSlots: 0,
    nextFacilityId: 1,
    stats: { failures: 0, launches: 0, incidents: 0, peakValuation: 0, lawsuits: 0 },
    ownChips: false,
    chipsRemaining: 0,
    safety: 0.2,
    compliance: strict ? B.COMPLIANCE_START - 20 : B.COMPLIANCE_START,
    automation: { autoTrain: false, autoBuy: false, autoResearch: false },
    rivals: [],
    upgrades: {},
    archLevel: 0,
    board: {
      quarter: 1,
      timer: 0,
      lastArr: 0,
      missedStreak: 0,
      patience: false,
      truthRoundBonus: false,
      poachMult: 1,
      salaryMult: 1,
      revenueThisQuarter: 0,
      costsThisQuarter: 0,
      profitStreak: 0,
      history: [],
    },
    timed: {
      gpuShortageUntil: 0,
      hireDiscountUntil: 0,
      frozenUntil: 0,
      hearingUntil: 0,
      promiseReadyAt: 0,
      roundReadyAt: 0,
    },
    modal: null,
    eventTimer: 0,
    eventCooldowns: {},
    scandalTimer: 0,
    incidentLog: 0,
    sentiment: 0.5,
    roundsRaised: 0,
    rivalsBorn: 0,
    bankruptTimer: 0,
    unpaidTimer: 0,
    incomeBuffer: 0,
    bubbleTimer: 0,
    ipoAvailable: false,
    log: [],
    nextLogId: 1,
    ending: null,
    modifiers,
    prestige: prestige ?? { papers: 0, runs: 0, endingsSeen: [], unlockedModifiers: [] },
  };
}

export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}
