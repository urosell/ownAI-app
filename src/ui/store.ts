import { create } from 'zustand';
import { apply, type Action } from '../engine/actions';
import { B } from '../engine/balance';
import { clearStorage, loadFromStorage, saveToStorage } from '../engine/save';
import { initialState, type GameState, type ModifierId } from '../engine/state';
import { tick } from '../engine/tick';
import { EMPTY_MANIFEST, loadManifest, type Manifest } from '../scene/manifest';

interface Store {
  game: GameState;
  manifest: Manifest;
  speed: number;
  dispatch: (a: Action) => void;
  step: (seconds: number) => void;
  replace: (s: GameState) => void;
  newGame: (modifiers?: ModifierId[]) => void;
  setSpeed: (n: number) => void;
  save: () => void;
}

export const useGame = create<Store>((set, get) => ({
  game: loadFromStorage() ?? initialState(),
  manifest: EMPTY_MANIFEST,
  speed: 1,
  dispatch: (a) => set({ game: apply(get().game, a) }),
  step: (seconds) => {
    let g = get().game;
    // Procesa como máximo MAX_CATCHUP_SECONDS (el resto se pierde, como en Paperclips).
    let left = Math.min(seconds, B.MAX_CATCHUP_SECONDS * Math.max(1, get().speed));
    while (left > 1e-9 && !g.modal && !g.ending) {
      const dt = Math.min(B.TICK_DT, left);
      g = tick(g, dt);
      left -= dt;
    }
    set({ game: g });
  },
  replace: (s) => set({ game: s }),
  newGame: (modifiers = []) => {
    const prev = get().game;
    clearStorage();
    set({ game: initialState(undefined, prev.prestige, modifiers) });
  },
  setSpeed: (n) => set({ speed: n }),
  save: () => saveToStorage(get().game),
}));

export function startLoop(): () => void {
  // setTimeout (no requestAnimationFrame) para que el juego siga en segundo plano mientras el
  // navegador lo permita; al volver, `step` procesa como máximo 60 s acumulados.
  let last = performance.now();
  let saveAcc = 0;
  let frame = 0;
  let acc = 0;
  const loop = () => {
    const now = performance.now();
    const real = (now - last) / 1000;
    last = now;
    const { step, speed, save } = useGame.getState();
    acc += real * speed;
    if (acc >= B.TICK_DT) {
      step(acc);
      acc = 0;
    }
    saveAcc += real;
    if (saveAcc >= B.AUTOSAVE_SECONDS) {
      saveAcc = 0;
      save();
    }
    frame = window.setTimeout(loop, 100);
  };
  frame = window.setTimeout(loop, 100);
  const onHide = () => useGame.getState().save();
  window.addEventListener('beforeunload', onHide);
  loadManifest().then((m) => useGame.setState({ manifest: m }));
  return () => {
    window.clearTimeout(frame);
    window.removeEventListener('beforeunload', onHide);
  };
}
