import { describe, expect, it } from 'vitest';
import { applyInPlace } from './actions';
import { B } from './balance';
import { capabilityFromLoss, chinchillaLoss, myRank, scalingEfficiency, valuationOf } from './formulas';
import { enterPhase } from './phase';
import { initialState, type GameState, type Model } from './state';
import { tickInPlace } from './tick';

function phase2(seed = 1): GameState {
  const s = initialState(seed);
  s.phase = 1;
  s.gpus.consumer = 1;
  s.money = 1e6;
  enterPhase(s, 2);
  s.modal = null;
  return s;
}

function model(over: Partial<Model> = {}): Model {
  return { id: 'm1', name: 'OwnAI-1', kind: 'pretrain', N: 7e10, D: 1.4e12, baseCapability: 60, sft: true, rlhf: 65, evaluated: false, released: false, createdAt: 0, ...over };
}

function run(s: GameState, seconds: number, onModal?: (s: GameState) => void) {
  for (let i = 0; i < seconds * 10; i++) {
    tickInPlace(s, 0.1);
    if (s.modal) {
      if (onModal) onModal(s);
      else s.modal = null;
    }
  }
}

describe('fase 2', () => {
  it('al entrar hay 3 rivales por encima del mejor fine-tune posible', () => {
    const s = phase2();
    expect(s.rivals).toHaveLength(3);
    for (const r of s.rivals) expect(r.releasedCapability).toBeGreaterThan(60);
  });

  it('la eficiencia de escalado es máxima con D ≈ 20·N', () => {
    expect(scalingEfficiency(1e10, 2e11, B.CH_E)).toBeGreaterThan(0.97);
    expect(scalingEfficiency(1e11, 2e10, B.CH_E)).toBeLessThan(0.8);
  });

  it('sin SFT no se puede lanzar un modelo preentrenado', () => {
    const s = phase2();
    s.models.push(model({ sft: false }));
    applyInPlace(s, { type: 'launchModel', id: 'm1' });
    expect(s.models[0].released).toBe(false);
    s.models[0].sft = true;
    applyInPlace(s, { type: 'launchModel', id: 'm1' });
    expect(s.models[0].released).toBe(true);
    expect(s.activeModelId).toBe('m1');
  });

  it('lanzar por debajo de lo prometido penaliza la valoración y el hype', () => {
    const s = phase2();
    s.models.push(model());
    s.expectation = 80;
    s.hype = 50;
    applyInPlace(s, { type: 'launchModel', id: 'm1' });
    const cap = 60 + B.SFT_CAP_BONUS;
    const gap = 80 - cap;
    expect(s.valuationMult).toBeCloseTo(1 - 0.02 * gap, 5);
    expect(s.hype).toBeCloseTo(50 + cap / 5 - gap, 5);
    expect(s.expectation).toBe(cap);
  });

  it('prometer tiene cooldown de 60 s', () => {
    const s = phase2();
    applyInPlace(s, { type: 'promise' });
    expect(s.hype).toBe(B.PROMISE_HYPE);
    expect(s.expectation).toBe(B.PROMISE_EXPECTATION);
    applyInPlace(s, { type: 'promise' });
    expect(s.hype).toBe(B.PROMISE_HYPE);
  });

  it('la API genera ingresos limitados por la capacidad de servicio', () => {
    const s = phase2();
    s.models.push(model({ released: true, N: 7e9, baseCapability: 50 }));
    s.activeModelId = 'm1';
    s.gpus.datacenter = 10;
    s.gpus.consumer = 0;
    s.gpuAlloc = 0;
    run(s, 10);
    expect(s.servedTps).toBeGreaterThan(0);
    expect(s.servedTps).toBeLessThanOrEqual(10 * B.TOKENS_PER_GPU + 1);
    expect(s.revenuePerSecond).toBeGreaterThan(0);
    expect(s.valuation).toBeGreaterThan(0);
    expect(Math.abs(s.valuation / (valuationOf(s) * s.valuationMult) - 1)).toBeLessThan(0.01);
  });

  it('cada 180 s se abre la junta y pausa el juego', () => {
    const s = phase2();
    let opened = 0;
    run(s, 179);
    expect(s.modal).toBeNull();
    for (let i = 0; i < 20 && !s.modal; i++) tickInPlace(s, 0.1);
    expect(s.modal?.kind).toBe('board');
    const t = s.t;
    tickInPlace(s, 1);
    expect(s.t).toBe(t);
    opened++;
    expect(opened).toBe(1);
  });

  it('incumplir dos veces sin decir la verdad despide al CEO', () => {
    const s = phase2();
    let boards = 0;
    run(s, 365, (st) => {
      if (st.modal?.kind === 'board') {
        boards++;
        applyInPlace(st, { type: 'boardChoice', choice: st.modal.met ? 'ok' : 'agi' });
      } else st.modal = null;
    });
    expect(boards).toBe(2);
    expect(s.log.some((l) => l.type === 'board' && /CEO/.test(l.text))).toBe(true);
    expect(s.timed.frozenUntil).toBeGreaterThan(0);
  });

  it('una ronda da el 20 % de la valoración y diluye', () => {
    const s = phase2();
    s.valuation = 1e9;
    s.timed.roundReadyAt = 0;
    const before = s.money;
    applyInPlace(s, { type: 'raiseRound' });
    expect(s.money - before).toBeCloseTo(2e8, -3);
    expect(s.dilution).toBe(15);
    applyInPlace(s, { type: 'raiseRound' });
    expect(s.dilution).toBe(15); // cooldown
  });

  it('entrar en el top 3 pasa a la Fase 3', () => {
    const s = phase2();
    s.models.push(model({ released: true, baseCapability: 90 }));
    s.activeModelId = 'm1';
    expect(myRank(s)).toBeLessThanOrEqual(3);
    run(s, 1);
    expect(s.phase).toBe(3);
  });

  it('las referencias de Chinchilla de la maqueta cuadran (70B · 1,4T ≈ 71)', () => {
    expect(capabilityFromLoss(chinchillaLoss(7e10, 1.4e12))).toBeGreaterThan(65);
  });
});
