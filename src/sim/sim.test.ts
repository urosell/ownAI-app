import { describe, expect, it } from 'vitest';
import { simulate } from './simulate';

describe('simulación de balance', () => {
  it('el bot termina la partida y pasa por todas las fases', () => {
    for (const seed of [1000, 8919]) {
      const r = simulate(seed);
      expect(r.ending, `semilla ${seed}`).not.toBeNull();
      expect(r.phaseMinutes.slice(0, 3).every((m) => Number.isFinite(m) && m > 0)).toBe(true);
    }
  });

  it('es reproducible con la misma semilla', () => {
    expect(simulate(1234, 60).state.t).toBe(simulate(1234, 60).state.t);
    expect(simulate(1234, 60).state.money).toBe(simulate(1234, 60).state.money);
  });
});
