import { describe, expect, it } from 'vitest';
import { applyInPlace } from './actions';
import { B } from './balance';
import { papersFor, triggerEnding } from './endings';
import { poweredFraction, totalFlops } from './formulas';
import { enterPhase } from './phase';
import { initialState, type GameState, type Model } from './state';
import { tickInPlace } from './tick';

function model(over: Partial<Model> = {}): Model {
  return { id: 'm1', name: 'OwnAI-9', kind: 'pretrain', N: 3e11, D: 6e12, baseCapability: 80, sft: true, rlhf: 65, evaluated: false, released: false, createdAt: 0, ...over };
}

function phase3(seed = 1): GameState {
  const s = initialState(seed);
  s.phase = 1;
  s.money = 1e10;
  enterPhase(s, 2);
  s.gpus.datacenter = 10000;
  enterPhase(s, 3);
  s.modal = null;
  return s;
}

function run(s: GameState, seconds: number) {
  for (let i = 0; i < seconds * 10 && !s.ending; i++) {
    tickInPlace(s, 0.1);
    if (s.modal) {
      if (s.modal.kind === 'board') applyInPlace(s, { type: 'boardChoice', choice: s.modal.met ? 'ok' : 'truth' });
      else s.modal = null;
    }
  }
}

describe('fase 3', () => {
  it('al entrar, las GPUs que ya tenías siguen con energía y con hueco', () => {
    const s = phase3();
    expect(poweredFraction(s)).toBe(1);
    expect(s.colocationSlots).toBeGreaterThanOrEqual(10000);
  });

  it('sin energía suficiente, las GPUs no rinden', () => {
    const s = phase3();
    const before = totalFlops(s);
    s.gpus.datacenter *= 2;
    expect(poweredFraction(s)).toBeCloseTo(0.5, 1);
    expect(totalFlops(s)).toBeCloseTo(before, -10);
  });

  it('un centro de datos tarda 120 s y da 20.000 huecos', () => {
    const s = phase3();
    applyInPlace(s, { type: 'buildDatacenter', location: 'texas' });
    expect(s.datacenters).toHaveLength(1);
    run(s, 121);
    expect(s.datacenters[0].buildRemaining).toBeLessThanOrEqual(0);
  });

  it('lanzar sin evaluación baja el cumplimiento normativo', () => {
    const s = phase3();
    s.models.push(model());
    const before = s.compliance;
    applyInPlace(s, { type: 'launchModel', id: 'm1' });
    expect(s.compliance).toBeLessThanOrEqual(before + B.COMPLIANCE_LAUNCH_NO_EVAL);
  });

  it('con chips propios las GPUs rinden un 25 % más', () => {
    const s = phase3();
    const before = totalFlops(s);
    applyInPlace(s, { type: 'researchChips' });
    run(s, B.CHIPS_SECONDS + 1);
    expect(s.ownChips).toBe(true);
    expect(totalFlops(s)).toBeCloseTo(before * B.OWN_CHIPS_FLOPS_MULT, -10);
  });

  it('las automatizaciones necesitan capacidad 85', () => {
    const s = phase3();
    s.ideas = 1e5;
    applyInPlace(s, { type: 'buyAutomation', id: 'autoResearch' });
    expect(s.automation.autoResearch).toBe(false);
    s.models.push(model({ baseCapability: 85, released: true }));
    s.activeModelId = 'm1';
    applyInPlace(s, { type: 'buyAutomation', id: 'autoResearch' });
    expect(s.automation.autoResearch).toBe(true);
  });
});

describe('finales', () => {
  it('AGI con seguridad ≥ 0,6; sin frenos por debajo', () => {
    const a = phase3();
    a.safety = 0.7;
    a.models.push(model({ baseCapability: 96, released: true }));
    a.activeModelId = 'm1';
    run(a, 1);
    expect(a.ending).toBe('agi');
    expect(a.phase).toBe(4);

    const b = phase3();
    b.safety = 0.3;
    b.models.push(model({ baseCapability: 96, released: true }));
    b.activeModelId = 'm1';
    run(b, 1);
    expect(b.ending).toBe('agiUnsafe');
  });

  it('60 s con dinero negativo: adquisición o cierre según la capacidad', () => {
    const s = phase3();
    s.money = -1e9;
    s.models.push(model({ baseCapability: 70, released: true }));
    s.activeModelId = 'm1';
    run(s, 61);
    expect(s.ending).toBe('acquired');

    const t = phase3();
    t.money = -1e12;
    run(t, 61);
    expect(t.ending).toBe('shutdown');
  });

  it('estalla la burbuja si la expectativa supera 1,6 × capacidad con V ≥ 1e9', () => {
    const s = phase3();
    s.models.push(model({ baseCapability: 40, released: true, N: 1e9 }));
    s.activeModelId = 'm1';
    s.gpus.datacenter = 0;
    s.expectation = 100;
    s.hype = 100;
    s.valuationMult = 100;
    run(s, B.BUBBLE_GRACE_SECONDS + 2);
    expect(s.ending).toBe('bubble');
  });

  it('los papers solo se dan la primera vez que ves un final', () => {
    const s = phase3();
    s.maxCapability = 87;
    expect(papersFor(s, 'agi')).toBe(10);
    triggerEnding(s, 'agi');
    expect(s.prestige.papers).toBe(10);
    expect(s.prestige.unlockedModifiers).toContain('oneRivalLess');
    const next = initialState(2, s.prestige);
    next.maxCapability = 99;
    expect(papersFor(next, 'agi')).toBe(0);
    expect(papersFor(next, 'ipo')).toBe(11);
  });
});
