// Todos los números de balance del juego. Nada de números mágicos fuera de aquí.
// Si cambias algo respecto a la spec, anótalo en BALANCE_NOTES.md.

export const B = {
  // ── Motor ────────────────────────────────────────────────
  TICK_DT: 0.1,
  GAME_HOURS_PER_SECOND: 1,
  SECONDS_PER_HOUR: 3600,
  QUARTER_SECONDS: 180,
  MAX_CATCHUP_SECONDS: 60,
  AUTOSAVE_SECONDS: 10,
  LOG_MAX: 50,
  START_MONEY: 0,
  UNPAID_LEAVE_SECONDS: 5, // si no puedes pagar sueldos (Fases 0–1), se va alguien cada 5 s
  INCOME_EMA_SECONDS: 5,

  // ── Fase 0 · IA de mentira ───────────────────────────────
  PROMPT_RATE_BASE: 0.5, // prompts/s
  PROMPT_RATE_REP_DIVISOR: 50, // rate × (1 + rep/50)
  // Campañas de marketing (no están en la spec): cada nivel suma un 40 % a la llegada de prompts.
  // Con reputación 100 y los 5 niveles: 0,5 × 3 × 3 = 4,5 prompts/s.
  MARKETING_BONUS: 0.4,
  MARKETING_BASE_COST: 60,
  MARKETING_GROWTH: 2,
  MARKETING_MAX: 5,
  PROMPT_TTL: 20,
  QUEUE_MAX: 10,
  PROMPT_REWARD: 1, // € × calidad (precio de referencia del prompt)
  // Precio del prompt (no está en la spec). Llegada × (1/precio)^elasticidad, y cada prompt
  // respondido da reputación × (2 − precio): a 1 € igual que antes, a 2 € nada, por encima resta.
  PROMPT_PRICE_MIN: 0.2,
  PROMPT_PRICE_MAX: 3,
  PROMPT_PRICE_STEP: 0.1,
  PROMPT_PRICE_ELASTICITY: 1,
  PROMPT_EXPIRE_REP: -0.5,
  PROMPT_ANSWER_REP: 0.15, // reputación por prompt respondido (no está en la spec)
  QUALITY_BASE: 1.0,
  ANNOTATOR_BASE_COST: 15,
  ANNOTATOR_COST_GROWTH: 1.15,
  ANNOTATOR_SALARY: 0.2, // €/s
  ANNOTATOR_SPEED: 0.3, // prompts/s
  TEMPLATES_COST: 50,
  TEMPLATES_SPEED_MULT: 1.5,
  TEMPLATES_QUALITY: 0.9,
  ANGEL_UNLOCK_EARNED: 300,
  ANGEL_AMOUNT: 2000,
  AUDIT_INTERVAL: 60,
  AUDIT_P_PER_ANNOTATOR: 0.02,
  AUDIT_MONEY_LOSS: 0.5,
  AUDIT_REP_LOSS: -20,
  TOKENS_PER_ANNOTATED_PROMPT: 2000,
  FIRST_GPU_COST: 1500,

  // ── Computación ──────────────────────────────────────────
  GPU: {
    consumer: { flops: 1e14, baseCost: 1500, growth: 1.12, upkeep: 0.05 },
    datacenter: { flops: 4e14, baseCost: 30000, growth: 1.03, upkeep: 0.4 },
    rented: { flops: 4e14, rentPerSecond: 3 },
  },
  // Cupo de la nube: el proveedor no te da más GPUs de las que "puede garantizar".
  RENT_LIMIT: {
    phase1: 8,
    phase2Base: 300,
    phase2PerQuarter: 200,
    phase3Base: 4000,
    phase3PerQuarter: 1500,
  },
  OWN_CHIPS_PRICE_MULT: 0.6,
  OWN_CHIPS_FLOPS_MULT: 1.25,
  GPU_SHORTAGE_MULT: 1.5,
  DEFAULT_GPU_ALLOC: 0.7,
  // 1 s real = 1 h de juego: los ingresos por tokens se cobran por hora de juego,
  // y el ARR se calcula con 8.760 "segundos-hora" al año (ver BALANCE_NOTES).
  TOKEN_SECONDS_PER_REAL_SECOND: 3600,
  ARR_SECONDS_PER_YEAR: 8760,
  PUE: 2.5, // MW totales por MW de GPU (refrigeración incluida): 20.000 GPUs = 50 MW

  // ── Escalado (Chinchilla, Hoffmann et al. 2022) ─────────
  CH_A: 406.4,
  CH_B: 410.7,
  CH_ALPHA: 0.34,
  CH_BETA: 0.28,
  CH_E: 1.69,
  L_REF: 3.0,
  E_BASE: 1.69,
  CHINCHILLA_TOKENS_PER_PARAM: 20,
  FLOPS_PER_PARAM_TOKEN: 6,

  // ── Entrenamiento ───────────────────────────────────────
  TRAIN_MIN_SECONDS: 10,
  TRAIN_FIXED_COST: 50, // € de preparación por entrenamiento
  TRAIN_COST_PER_FLOP: 2e-17, // energía + operaciones
  P_PHASE: { 1: 0.25, 2: 0.45, 3: 0.6, 4: 0.6 } as Record<number, number>,
  P_INFRA_MAX: 0.2,
  ABLATION_OPTIONS: [0, 0.05, 0.1] as const,
  ABLATION_BONUS: [0, 0.08, 0.12] as const,
  P_RESEARCHER: 0.02,
  P_SENIOR: 0.04,
  P_TEAM_MAX: 0.2,
  P_PER_FAILURE: 0.02,
  P_FAILURES_MAX: 0.1,
  P_PER_PAPER: 0.01,
  P_PAPERS_MAX: 0.1,
  P_SIZE_K: 0.04,
  P_SIZE_LOG_OFFSET: 20,
  P_MIN: 0.05,
  P_MAX: 0.97,
  FAIL_AT_MIN: 0.2,
  FAIL_AT_MAX: 0.9,
  RESUME_COST_MIN: 0.3,
  RESUME_COST_MAX: 0.6,
  LOSS_NOISE: 0.02,
  LOSS_SPIKE_MIN: 1.5,
  LOSS_SPIKE_MAX: 3,
  LOSS_POINTS: 80,

  // ── Fine-tuning (Fase 1) ────────────────────────────────
  FT_MODELS: {
    small: { N: 1e9, baseCap: 25, minGpus: 1, label: 'Pequeño · 1 mil M' },
    medium: { N: 7e9, baseCap: 38, minGpus: 4, label: 'Mediano · 7 mil M' },
  },
  FT_GAIN: 20,
  FT_TOKEN_SCALE: 2e8,
  FT_EPOCH_FACTOR: [0.7, 1.0, 1.1, 1.0, 0.8],
  FT_LOSS_START_EXTRA: 0.6, // solo visual: la loss de la tarea nueva empieza algo más alta
  FT_LOSS_CURVE_K: 4,

  // ── Datos ────────────────────────────────────────────────
  SCRAPE_RATE: 2e6, // tokens/s
  SCRAPE_RATE_P2: 3e8, // crawler a escala web en Fase 2+
  LAWSUIT_UNIT_P2: 1e10, // en Fase 2+ el riesgo sube 0,1 por cada 1e10 tokens
  DATA_MAX_REPEAT: 4, // D puede repetir el dataset hasta 4 veces (Muennighoff et al. 2023)
  LICENSE_DEAL_P2: { cost: 2e6, tokens: 2e11 },
  QUALITY: { clean: 1.0, scraped: 0.8, licensed: 1.0, synthetic: 1.0 },
  LAWSUIT_RISK_PER_1E8: 0.1, // puntos % por cada 1e8 tokens scrapeados
  LAWSUIT_RISK_MAX: 40,
  LICENSED_COST: 500,
  LICENSED_TOKENS: 5e7,
  SYNTHETIC_RATE: 2e8, // tokens/s con la mejora
  SYNTHETIC_COLLAPSE_THRESHOLD: 0.4,
  SYNTHETIC_COLLAPSE_K: 0.3, // capacidad −(exceso% × 0,3)
  LAWSUIT_FINE: 0.1, // pagar la multa: 10 % del dinero, el riesgo se reduce a la mitad
  LAWSUIT_SETTLE: 0.2, // acuerdo de licencia: 20 % del dinero, el riesgo vuelve a 0 y lo scrapeado pasa a licencia

  // ── Producto wrapper (Fase 1) ───────────────────────────
  WRAPPER_USERS_K: 0.5,
  WRAPPER_APPROACH: 0.02,
  WRAPPER_REVENUE_PER_USER: 0.05,
  WRAPPER_COST_PER_USER: 0.01,
  WRAPPER_USERS_PER_GPU: 120, // usuarios que sirve 1e14 FLOP/s con un modelo de 1e9 parámetros
  BENCH_CONTAMINATION: 10,
  BENCH_CHECK_INTERVAL: 60,
  BENCH_DISCOVER_P: 0.05,
  BENCH_DISCOVER_HYPE: -20,
  BENCH_DISCOVER_REP: -15,
  SERIES_A_USERS: 1000,
  SERIES_A_AMOUNT: 500000,

  // ── Talento ─────────────────────────────────────────────
  RESEARCHER_COST: 5000,
  RESEARCHER_GROWTH: 1.25,
  RESEARCHER_SALARY: 2,
  RESEARCHER_IDEAS: 0.1,
  SENIOR_COST: 50000,
  SENIOR_GROWTH: 1.3,
  SENIOR_SALARY: 20,
  SENIOR_IDEAS: 0.5,
  POACH_P_BASE: 0.1,
  POACH_MIN: 0.2,
  POACH_MAX: 0.5,
  POACH_RIVAL_THRESHOLD: 5,
  PAPER_HIRE_DISCOUNT: 0.02,
  VIRAL_PAPER_DISCOUNT: 0.3,

  // ── Inferencia y API (Fase 2+) ──────────────────────────
  TOKENS_PER_GPU: 2000,
  REF_PARAMS: 7e9,
  DEMAND_BASE: 1e5,
  DEMAND_CAP_REF: 50,
  DEMAND_CAP_EXP: 3,
  DEMAND_PRICE_EXP: 1.5,
  MARKET_GROWTH_PER_QUARTER: 1.2, // la adopción de la IA crece: demanda ×1,2 por trimestre desde la Fase 2
  MARKET_PRICE_START: 10,
  MARKET_PRICE_DROP: 0.15,
  MARKET_PRICE_DROP_MINOR: 0.05, // lanzamiento de un rival que no supera al mejor modelo del mercado
  MARKET_PRICE_MIN: 0.2,
  API_PRICE_START: 10,
  LATENCY_OVERLOAD: 1.2,
  LATENCY_REP_PER_SECOND: -0.05,
  VALUATION_MULT_RECOVERY: 0.002, // el mercado olvida: el multiplicador vuelve a 1 un 0,2 % por segundo
  CONTRACT_TPS_FRACTION: [0.15, 0.35] as const, // tokens/s pedidos, fracción de tu capacidad actual
  CONTRACT_PREMIUM: 1.5, // pagan un 50 % más que la API
  EQUITY_POOL_SIZE: 10, // % de la empresa
  RLHF_SCANDAL_INTERVAL: 60,
  PATIENCE_ARR_GROWTH: 1.2,
  OPT: {
    quantization: { eff: 1.8, cap: -1 },
    distillation: { eff: 2, cap: -3 },
    contextCache: { eff: 1.3, cap: 0 },
  },

  // ── Pre y post-entrenamiento (Fase 2) ───────────────────
  PRETRAIN_LOG_N_MIN: 9,
  PRETRAIN_LOG_N_MAX: 11,
  PRETRAIN_LOG_N_MAX_P3: 12.3,
  PRETRAIN_LOG_D_MIN: 10,
  PRETRAIN_LOG_D_MAX: 13,
  PRETRAIN_LOG_D_MAX_P3: 13.6,
  SFT_C_FRACTION: 0.01,
  SFT_CAP_BONUS: 5,
  RLHF_LOW: 40,
  RLHF_HIGH: 85,
  RLHF_DEMAND_PENALTY: 0.02,
  RLHF_DEFAULT: 65,
  REASONING_CAP_BONUS: 4,

  // ── Hype, expectativas, valoración ──────────────────────
  HYPE_DECAY: 0.003, // por segundo
  PROMISE_COOLDOWN: 60,
  PROMISE_HYPE: 15,
  PROMISE_EXPECTATION: 8,
  LAUNCH_GAP_VALUATION_K: 0.02,
  LAUNCH_HYPE_DIV: 5,
  VAL_ARR_BASE: 5,
  VAL_ARR_HYPE_DIV: 10,
  VAL_CAP_K: 2e5,
  VAL_CAP_EXP: 1.5,
  SECONDS_PER_YEAR: 31536000,
  ROUND_FRACTION: 0.2,
  ROUND_DILUTION: 15,
  ROUND_MAX_DILUTION: 90,
  ROUND_NAMES: ['Serie B', 'Serie C', 'Serie D', 'Serie E', 'Serie F', 'Ronda estratégica', 'Ronda pre-IPO'],

  // ── Contratos enterprise ────────────────────────────────
  CONTRACT_EVERY_MIN_Q: 1,
  CONTRACT_EVERY_MAX_Q: 2,
  CONTRACT_DURATION_Q: [2, 4] as const,
  CONTRACT_SLA_PENALTY: 3,
  CONTRACT_OFFER_TTL: 60,

  // ── Junta ───────────────────────────────────────────────
  BOARD_ARR_GROWTH: 1.5,
  BOARD_ARR_MIN: 1e6,
  BOARD_ARR_WINDOW: 3, // el objetivo de ARR crece sobre la media de los últimos 3 trimestres, no sobre el último
  BOARD_CAP_MARGIN: 5,
  BOARD_SUCCESS_VAL: 0.1,
  BOARD_FAKE_EXPECTATION: 12,
  BOARD_AGI_HYPE: 25,
  BOARD_AGI_EXPECTATION: 20,
  BOARD_PIVOT_ROUND: 0.05,
  BOARD_LAYOFF_SALARY: 0.7,
  BOARD_LAYOFF_STAFF: 0.25,
  BOARD_TRUTH_VAL: -0.1,
  BOARD_TRUTH_ROUND_MULT: 1.2,
  CEO_FREEZE: 20,
  CEO_HYPE: -10,

  // ── Rivales ─────────────────────────────────────────────
  // cap(t) = capMax / (1 + e^(−r·(t − t0))), t en segundos desde el inicio de la Fase 2.
  // Ajustados para empezar en 87/85/83 (por encima de los primeros preentrenamientos) y llegar a ~97/94/91 a los 40 min.
  // El más débil se estanca en 94 para que un jugador rezagado pueda alcanzarlo.
  RIVALS: [
    { id: 'closedai', name: 'ClosedAI', capMax: 99.7, r: 0.00069, t0: -2787 },
    { id: 'anthropomorphic', name: 'Anthropomorphic', capMax: 97.5, r: 0.000572, t0: -3349 },
    { id: 'gemelo', name: 'Gemelo Labs', capMax: 94, r: 0.00058, t0: -3486 },
  ],
  RIVAL_RELEASE_Q: [2, 4] as const,
  RIVAL_FOUNDED_CAPMAX: 85,
  MAX_FOUNDED_RIVALS: 3,
  RIVAL_FOUNDED_R: 0.002,
  TOP_N_FOR_PHASE3: 3,
  PHASE3_VALUATION: 1e10,

  // ── Fase 3 ──────────────────────────────────────────────
  DC_COST: 5e8,
  DC_BUILD_SECONDS: 120,
  DC_SLOTS: 20000,
  DC_PRICE_STEP: 200, // cada centro de datos propio: el precio sube un 3 % cada 200 GPUs más (compras al por mayor)
  DC_POWER_MW: 50,
  GARAGE_SLOTS: 2000, // huecos mínimos en colocation al entrar en la Fase 3
  LOCATIONS: [
    { id: 'aragon', name: 'Desierto de Aragón', energyMult: 0.9, regulation: 1.0, subsidy: 0.1 },
    { id: 'texas', name: 'Texas', energyMult: 0.8, regulation: 0.7, subsidy: 0 },
    { id: 'norway', name: 'Fiordo noruego', energyMult: 0.6, regulation: 1.3, subsidy: 0.2 },
  ],
  GPU_KW: 1,
  GRID_PRICE_MWH: 80,
  GRID_MAX_MW: 150, // la red no da para más: a partir de aquí, solar o nuclear
  GRID_STEP_MW: 10,
  SOLAR_COST: 2e8,
  SOLAR_MW: 100,
  SOLAR_SECONDS: 90,
  SOLAR_PRICE_MWH: 30,
  NUCLEAR_COST: 3e9,
  NUCLEAR_MW: 1000,
  NUCLEAR_SECONDS: 300,
  NUCLEAR_PRICE_MWH: 20,
  CHIPS_COST: 2e9,
  CHIPS_SECONDS: 240,
  COMPLIANCE_START: 60,
  COMPLIANCE_LAUNCH_NO_EVAL: -15,
  EVAL_SECONDS: 60,
  EVAL_C_FRACTION: 0.005,
  EVAL_COMPLIANCE: 10,
  COMPLIANCE_FINE_THRESHOLD: 30,
  COMPLIANCE_FINE_FRACTION: 0.05,
  HEARING_SECONDS: 90,
  LOBBY_COST: 5e7,
  LOBBY_COMPLIANCE: 5,
  LOBBY_SCANDAL_P: 0.1,
  SAFETY_TEAM_COST_RESEARCHERS: 2,
  SAFETY_TEAM_COST_IDEAS: 300,
  SAFETY_PER_TEAM: 0.12,
  SAFETY_BASE: 0.2,
  LOBBY_SCANDAL_HYPE: -15,
  AUTO_BUY_RESERVE: 0.5, // la auto-compra gasta como mucho la mitad del dinero en cada compra
  AUTO_TRAIN_DURATIONS: [120, 300, 600, 900], // la auto-entrenadora prueba estas duraciones (s), de menor a mayor
  SAFETY_CUT_IDEAS_MULT: 1.2,
  INCIDENT_P: 0.15,
  INCIDENT_HYPE: -40,
  INCIDENT_COMPLIANCE: -30,
  AUTOMATION_CAP: 85,
  AUTOMATION_COST: { autoTrain: 3000, autoBuy: 2000, autoResearch: 5000 },
  AUTO_RESEARCH_MULT: 2,

  // ── Investigación (ideas) ───────────────────────────────
  UPGRADES: {
    checkpoints: { cost: 20, phase: 1 },
    monitoring: { cost: 40, phase: 1 },
    fastNetwork: { cost: 150, phase: 2 },
    quantization: { cost: 100, phase: 2 },
    distillation: { cost: 250, phase: 2 },
    contextCache: { cost: 200, phase: 2 },
    synthetic: { cost: 300, phase: 2 },
    reasoning: { cost: 2000, phase: 3 },
    ownCluster: { cost: 1000, phase: 3 },
  } as Record<string, { cost: number; phase: number }>,
  ARCH_BASE_COST: 4000,
  ARCH_GROWTH: 1.8,
  ARCH_LEVELS: 5,
  ARCH_E_MULT: 0.97,
  INFRA_BONUS: 0.05,

  // ── Eventos (§6) ─────────────────────────────────────────
  EVENT_INTERVAL: 30,
  // p: probabilidad por comprobación · minPhase · cooldown en segundos
  EVENTS: {
    openWeights: { p: 0.04, minPhase: 2, cooldown: 180, priceDrop: 0.25 },
    gpuShortage: { p: 0.03, minPhase: 1, cooldown: 360, quarters: 2 },
    jailbreak: { p: 0.03, minPhase: 2, cooldown: 120, hype: -15 },
    hallucination: { p: 0.02, minPhase: 1, cooldown: 120, rep: -10, hype: -10 },
    lawsuit: { p: 0, minPhase: 1, cooldown: 180 }, // P = lawsuitRisk %
    viralPaper: { p: 0.02, minPhase: 1, cooldown: 180 }, // × investigadores
    influencerAgi: { p: 0.02, minPhase: 2, cooldown: 180, hype: 20, expectation: 10 },
  },

  // ── Finales ─────────────────────────────────────────────
  END_AGI_CAP: 98,
  END_AGI_SAFETY: 0.6,
  END_IPO_VALUATION: 5e11,
  END_IPO_PROFIT_QUARTERS: 2,
  END_BANKRUPT_SECONDS: 60,
  END_ACQUIRED_CAP: 60,
  END_BUBBLE_RATIO: 1.6,
  END_BUBBLE_VALUATION: 1e9,
  BUBBLE_GRACE_SECONDS: 30, // la ratio debe mantenerse este tiempo (evita finales por un pico)

  // ── Prestigio ───────────────────────────────────────────
  PAPERS_BONUS: 2,
  PAPERS_CAP_DIV: 10,
  STRICT_REG_PAPERS_MULT: 1.5,
  BUBBLE_MOD_MULT: 2,
} as const;

export type UpgradeId = keyof typeof B.UPGRADES | `arch${number}`;
