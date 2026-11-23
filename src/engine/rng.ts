import type { GameState } from './state';

/** mulberry32: avanza la semilla guardada en el estado y devuelve un número en [0, 1). */
export function rand(s: { rngSeed: number }): number {
  let t = (s.rngSeed = (s.rngSeed + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(s: GameState, p: number): boolean {
  return rand(s) < p;
}

export function randRange(s: GameState, min: number, max: number): number {
  return min + (max - min) * rand(s);
}

export function randInt(s: GameState, min: number, maxInclusive: number): number {
  return Math.floor(randRange(s, min, maxInclusive + 1));
}

export function pick<T>(s: GameState, arr: readonly T[]): T {
  return arr[Math.floor(rand(s) * arr.length)];
}
