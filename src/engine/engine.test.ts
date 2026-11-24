import { describe, expect, it } from 'vitest';
import { apply } from './actions';
import { B } from './balance';
import { fmt, money } from './format';
import { capabilityFromLoss, chinchillaLoss, promptRate } from './formulas';
import { rand } from './rng';
import { deserialize, exportSave, importSave, serialize } from './save';
import { initialState } from './state';
import { advance, tick, tickInPlace } from './tick';

describe('rng', () => {
  it('es reproducible con la misma semilla', () => {
    const a = { rngSeed: 42 };
    const b = { rngSeed: 42 };
    const xs = Array.from({ length: 5 }, () => rand(a));
    const ys = Array.from({ length: 5 }, () => rand(b));
    expect(xs).toEqual(ys);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});

describe('formato', () => {
  it('usa unidades en español', () => {
    expect(fmt(1500)).toBe('1.500');
    expect(fmt(15000)).toBe('15 k');
    expect(fmt(2.3e6)).toBe('2,3 M');
    expect(fmt(4.1e9)).toBe('4,1 mil M');
    expect(fmt(1.2e12)).toBe('1,2 B');
    expect(money(1240)).toBe('1.240 €');
    expect(money(38.4e6)).toBe('38,4 M€');
  });
});

describe('ley de escalado', () => {
  it('coincide con las referencias de la spec', () => {
    expect(capabilityFromLoss(chinchillaLoss(1e9, 2e10))).toBeCloseTo(32, 0);
    expect(capabilityFromLoss(chinchillaLoss(1e12, 2e13))).toBeGreaterThan(90);
  });
});

describe('tick', () => {
  it('es puro: no muta el estado de entrada', () => {
    const s = initialState(1);
    const before = JSON.stringify(s);
    tick(s, 1);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('dos partidas con la misma semilla dan el mismo resultado', () => {
    const run = () => {
      let s = initialState(7);
      for (let i = 0; i < 300; i++) {
        s = tick(s, 0.1);
        if (i % 10 === 0) s = apply(s, { type: 'answerPrompt' });
      }
      return serialize({ ...s }).replace(/"savedAt":\d+/, '');
    };
    expect(run()).toBe(run());
  });
});

describe('fase 0', () => {
  it('llegan prompts y caducan', () => {
    const s = initialState(1);
    tickInPlace(s, 4);
    expect(s.queue.length).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) tickInPlace(s, 0.1);
    expect(s.queue.length).toBeLessThanOrEqual(B.QUEUE_MAX);
    expect(s.queue.every((p) => p.ttl > 0)).toBe(true);
  });

  it('responder da dinero y los anotadores generan datos', () => {
    let s = initialState(1);
    s = tick(s, 3);
    s = apply(s, { type: 'answerPrompt' });
    expect(s.money).toBeCloseTo(1, 5);
    s = { ...s, money: 100 };
    s = apply(s, { type: 'hireAnnotator' });
    expect(s.annotators).toBe(1);
    expect(s.money).toBe(100 - B.ANNOTATOR_BASE_COST);
    s = advance(s, 30);
    expect(s.data.clean).toBeGreaterThan(0);
  });

  it('el pitch se desbloquea con los euros ganados de la spec y activa la auditoría', () => {
    let s = initialState(1);
    s = apply(s, { type: 'pitchAngels' });
    expect(s.angelPitched).toBe(false);
    s = { ...s, totalEarned: B.ANGEL_UNLOCK_EARNED };
    s = apply(s, { type: 'pitchAngels' });
    expect(s.money).toBe(B.ANGEL_AMOUNT);
    expect(s.auditActive).toBe(true);
  });

  it('si no puedes pagar sueldos, se va gente y el dinero no baja de 0', () => {
    const s = initialState(1);
    s.annotators = 10;
    s.money = 0;
    for (let i = 0; i < 200; i++) tickInPlace(s, 0.1);
    expect(s.money).toBeGreaterThanOrEqual(0);
    expect(s.annotators).toBeLessThan(10);
  });

  it('el marketing sube la llegada de prompts por encima del tope de reputación', () => {
    let s = { ...initialState(1), reputation: 100, money: 10000 };
    expect(promptRate(s)).toBeCloseTo(1.5, 5);
    for (let i = 0; i < 10; i++) s = apply(s, { type: 'buyMarketing' });
    expect(s.marketing).toBe(B.MARKETING_MAX);
    expect(promptRate(s)).toBeCloseTo(1.5 * (1 + B.MARKETING_MAX * B.MARKETING_BONUS), 5);
    expect(s.money).toBe(10000 - [0, 1, 2, 3, 4].reduce((a, n) => a + B.MARKETING_BASE_COST * B.MARKETING_GROWTH ** n, 0));
  });

  it('se puede despedir anotadores', () => {
    let s = { ...initialState(1), annotators: 2 };
    s = apply(s, { type: 'fireAnnotator' });
    expect(s.annotators).toBe(1);
    s = apply(apply(s, { type: 'fireAnnotator' }), { type: 'fireAnnotator' });
    expect(s.annotators).toBe(0);
  });

  it('comprar la primera GPU pasa a la Fase 1', () => {
    let s = { ...initialState(1), money: 2000 };
    s = apply(s, { type: 'buyFirstGpu' });
    expect(s.phase).toBe(1);
    expect(s.gpus.consumer).toBe(1);
    expect(s.modal?.kind).toBe('phase');
  });
});

describe('guardado', () => {
  it('serializa y deserializa sin pérdidas', () => {
    const s = advance(initialState(3), 10);
    expect(deserialize(serialize(s))).toEqual(s);
  });

  it('exporta e importa en base64', () => {
    const s = advance(initialState(3), 10);
    expect(importSave(exportSave(s))).toEqual(s);
  });

  it('rellena campos que falten en guardados antiguos', () => {
    const s = initialState(3) as unknown as Record<string, unknown>;
    delete s.automation;
    const back = deserialize(JSON.stringify({ version: 1, state: s }));
    expect(back.automation).toBeDefined();
  });
});
