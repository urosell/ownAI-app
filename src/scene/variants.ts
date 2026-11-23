// Funciones estado → variante de cada slot. La escena solo lee el estado; nunca lo modifica.
import { arr, ownedGpus, runwayMonths, totalTokens } from '../engine/formulas';
import type { GameState } from '../engine/state';
import { sceneForPhase, type SceneId } from './scenes';

export interface SceneData {
  scene: SceneId;
  variants: Record<string, string>;
  /** Datos de texto para los placeholders (los sprites no los usan). */
  text: Record<string, string>;
}

type VariantFn = (s: GameState) => string;

const GARAGE: Record<string, VariantFn> = {
  annotators: (s) => String(Math.min(4, s.annotators)),
  pizza_boxes: (s) => String(Math.min(3, 1 + Math.floor(s.t / 300))),
  whiteboard: (s) => (s.phase === 0 ? '0' : '1'),
  laptop: (s) => (isBusy(s) ? 'typing' : 'idle'),
  founder: (s) => (isPanic(s) ? 'panic' : isBusy(s) ? 'typing' : 'idle'),
  gpu_rack: (s) => String(Math.min(4, ownedGpus(s) + s.gpus.rented)),
  smoke: (s) => (isPanic(s) ? 'on' : 'off'),
  sticky_note: (s) => {
    const m = runwayMonths(s);
    return m === Infinity || m > 6 ? 'ok' : m > 1 ? 'low' : 'broke';
  },
  data_box: (s) => {
    const t = totalTokens(s);
    return t <= 0 ? 'empty' : t < 2e8 ? 'some' : 'full';
  },
};

const OFFICE: Record<string, VariantFn> = {
  neon_sign: (s) => (s.hype > 60 ? 'hot' : 'on'),
  poufs: (s) => (s.users > 0 || s.researchers > 0 ? 'busy' : 'empty'),
  pingpong: (s) => (s.hype > 70 ? 'play' : 'idle'),
  valuation_screen: (s) => (s.valuationMult >= 1 && arr(s) >= s.board.lastArr ? 'up' : 'down'),
  engineer: (s) => (isBusy(s) ? 'typing' : 'idle'),
  founder: (s) => (isPanic(s) ? 'panic' : isBusy(s) ? 'typing' : 'idle'),
  server_room: (s) => {
    const g = s.gpus.datacenter + s.gpus.rented + s.gpus.consumer / 4;
    return g < 100 ? '1' : g < 500 ? '2' : g < 2000 ? '3' : '4';
  },
  servers_smoke: (s) => (isPanic(s) ? 'on' : 'off'),
};

const VARIANTS: Record<SceneId, Record<string, VariantFn>> = {
  garage: GARAGE,
  office: OFFICE,
  campus: {},
  ending: {},
};

function isBusy(s: GameState): boolean {
  return s.currentRun?.status === 'running' || (s.phase === 0 && s.queue.length > 0);
}

function isPanic(s: GameState): boolean {
  return s.currentRun?.status === 'failed';
}

function runwayText(s: GameState): string {
  const m = runwayMonths(s);
  if (m === Infinity) return 'rentable';
  if (m < 1) return '< 1 mes';
  if (m > 99) return '99+ meses';
  return `${Math.floor(m)} ${Math.floor(m) === 1 ? 'mes' : 'meses'}`;
}

export function sceneData(s: GameState): SceneData {
  const scene = sceneForPhase(s.phase);
  const variants: Record<string, string> = {};
  for (const [slot, fn] of Object.entries(VARIANTS[scene])) variants[slot] = fn(s);
  return {
    scene,
    variants,
    text: {
      runway: runwayText(s),
      quarter: String(s.board.quarter),
      day: String(Math.floor(s.t / 24) + 1),
    },
  };
}
