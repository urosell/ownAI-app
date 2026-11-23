import { describe, expect, it } from 'vitest';
import { applyInPlace } from './actions';
import { B } from './balance';
import { finetuneCapability, pSuccess } from './formulas';
import { planFinetune } from './phases/training';
import { initialState, type GameState } from './state';
import { tickInPlace } from './tick';

function phase1(seed = 1): GameState {
  const s = initialState(seed);
  s.money = 1600;
  applyInPlace(s, { type: 'buyFirstGpu' });
  s.modal = null;
  return s;
}

function run(s: GameState, seconds: number) {
  for (let i = 0; i < seconds * 10; i++) {
    tickInPlace(s, 0.1);
    if (s.modal?.kind === 'phase' || s.modal?.kind === 'lawsuit') s.modal = null;
  }
}

describe('fase 1', () => {
  it('la capacidad del fine-tune sigue la fórmula de la spec', () => {
    expect(finetuneCapability('small', 0, 2, 1)).toBe(25);
    expect(finetuneCapability('small', 1e12, 2, 1)).toBeCloseTo(45, 3);
    expect(finetuneCapability('small', 1e12, 3, 1)).toBeCloseTo(47, 3);
    expect(finetuneCapability('medium', 1e12, 5, 0.8)).toBeCloseTo(38 + 20 * 0.8 * 0.8, 3);
  });

  it('P(éxito) suma los términos y respeta los límites', () => {
    const s = phase1();
    expect(pSuccess(s, 1e18, 0).p).toBeCloseTo(0.25, 5);
    s.upgrades.checkpoints = true;
    s.researchers = 2;
    s.failedStreak = 1;
    const p = pSuccess(s, 1e22, 0.05);
    // 0,25 + 0,05 + 0,08 + 0,04 + 0,02 − 0,04·2
    expect(p.p).toBeCloseTo(0.36, 5);
    s.failedStreak = 50;
    s.researchers = 50;
    s.upgrades = { checkpoints: true, monitoring: true, fastNetwork: true, ownCluster: true };
    expect(pSuccess(s, 1e10, 0.1).p).toBeLessThanOrEqual(B.P_MAX);
  });

  it('el mediano necesita 4 GPUs', () => {
    const s = phase1();
    s.data.licensed = 1e8;
    s.money = 1e6;
    expect(planFinetune(s, { size: 'medium', tokens: 1e8, epochs: 1, ablation: 0 }).ok).toBe(false);
    s.gpus.consumer = 4;
    expect(planFinetune(s, { size: 'medium', tokens: 1e8, epochs: 1, ablation: 0 }).ok).toBe(true);
  });

  it('un entrenamiento termina (con éxito o con fallo) y dura al menos 10 s', () => {
    for (let seed = 1; seed < 20; seed++) {
      const s = phase1(seed);
      s.data.licensed = 1e8;
      s.money = 1000;
      applyInPlace(s, { type: 'startFinetune', params: { size: 'small', tokens: 1e8, epochs: 1, ablation: 0 } });
      expect(s.currentRun).not.toBeNull();
      run(s, 9);
      expect(s.currentRun === null).toBe(false);
      run(s, 200);
      const done = s.currentRun === null;
      if (done) expect(s.models.length).toBe(1);
      else {
        expect(s.currentRun!.status).toBe('failed');
        expect(s.currentRun!.progress).toBeGreaterThanOrEqual(B.FAIL_AT_MIN);
        expect(s.currentRun!.progress).toBeLessThanOrEqual(B.FAIL_AT_MAX);
        expect(s.failedStreak).toBe(1);
      }
    }
  });

  it('con checkpoints se puede reanudar un entrenamiento fallido', () => {
    let found = false;
    for (let seed = 1; seed < 60 && !found; seed++) {
      const s = phase1(seed);
      s.upgrades.checkpoints = true;
      s.data.licensed = 1e8;
      s.money = 100000;
      applyInPlace(s, { type: 'startFinetune', params: { size: 'small', tokens: 1e8, epochs: 1, ablation: 0 } });
      if (!s.currentRun!.willFail) continue;
      found = true;
      run(s, 60);
      expect(s.currentRun!.status).toBe('failed');
      const cost = s.currentRun!.resumeCost;
      expect(cost).toBeGreaterThan(0);
      const before = s.money;
      applyInPlace(s, { type: 'resumeRun' });
      expect(s.currentRun!.status).toBe('running');
      expect(s.money).toBeCloseTo(before - cost, 5);
    }
    expect(found).toBe(true);
  });

  it('con 1.000 usuarios se cierra la Serie A y empieza la Fase 2', () => {
    const s = phase1();
    s.niche = 'dentists';
    s.models.push({ id: 'm1', name: 'x', kind: 'finetune', N: 1e9, D: 1, baseCapability: 45, sft: false, rlhf: null, evaluated: false, released: true, createdAt: 0 });
    s.activeModelId = 'm1';
    s.gpus.rented = 20;
    s.money = 1e5;
    s.gpuAlloc = 0;
    run(s, 400);
    expect(s.phase).toBe(2);
    expect(s.log.some((l) => l.text.includes('Serie A'))).toBe(true);
  });

  it('el scraping da datos y sube el riesgo de demanda', () => {
    const s = phase1();
    applyInPlace(s, { type: 'setScraping', on: true });
    run(s, 50);
    expect(s.data.scraped).toBeCloseTo(B.SCRAPE_RATE * 50, -5);
    expect(s.lawsuitRisk).toBeCloseTo(0.1, 2);
  });
});
