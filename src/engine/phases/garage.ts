// Sistemas que arrancan en la Fase 1 y siguen después: datos, investigación, wrapper y benchmark.
import { B } from '../balance';
import { earn } from '../economy';
import { clamp, ideasPerSecond, lawsuitUnit, scrapeRate, wrapperUsersTarget } from '../formulas';
import { addLog } from '../log';
import { chance, pick } from '../rng';
import type { GameState } from '../state';
import { BENCH_SCANDAL, SERIES_A } from '../../content/text';
import { enterPhase } from '../phase';

export function tickData(s: GameState, dt: number): void {
  if (s.phase < 1) return;
  if (s.scraping) {
    const got = scrapeRate(s) * dt;
    s.data.scraped += got;
    s.lawsuitRisk = Math.min(B.LAWSUIT_RISK_MAX, s.lawsuitRisk + (B.LAWSUIT_RISK_PER_1E8 * got) / lawsuitUnit(s));
  }
  if (s.syntheticOn && s.upgrades.synthetic) s.data.synthetic += B.SYNTHETIC_RATE * dt;
}

export function tickResearch(s: GameState, dt: number): void {
  s.ideas += ideasPerSecond(s) * dt;
}

/** Wrapper de nicho: devuelve el coste de inferencia del tick. */
export function tickWrapper(s: GameState, dt: number): number {
  if (s.phase < 1) return 0;
  const target = wrapperUsersTarget(s);
  s.users += (target - s.users) * Math.min(1, B.WRAPPER_APPROACH * dt);
  if (s.users < 0.5 && target === 0) s.users = 0;
  earn(s, s.users * B.WRAPPER_REVENUE_PER_USER * dt);

  if (s.phase === 1 && s.users >= B.SERIES_A_USERS) {
    s.money += B.SERIES_A_AMOUNT;
    addLog(s, 'success', SERIES_A);
    enterPhase(s, 2);
  }
  return s.users * B.WRAPPER_COST_PER_USER;
}

export function tickBenchmark(s: GameState, dt: number): void {
  if (!s.benchContaminated) {
    s.benchTimer = 0;
    return;
  }
  s.benchTimer += dt;
  if (s.benchTimer >= B.BENCH_CHECK_INTERVAL) {
    s.benchTimer -= B.BENCH_CHECK_INTERVAL;
    if (chance(s, B.BENCH_DISCOVER_P)) {
      s.benchContaminated = false;
      s.hype = clamp(s.hype + B.BENCH_DISCOVER_HYPE, 0, 100);
      s.reputation = clamp(s.reputation + B.BENCH_DISCOVER_REP, 0, 100);
      addLog(s, 'press', pick(s, BENCH_SCANDAL));
    }
  }
}
