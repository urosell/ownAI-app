import { initialState, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'ownai_save_v1';

interface Envelope {
  version: number;
  savedAt: number;
  state: GameState;
}

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** Migraciones: MIGRATIONS[n] convierte un guardado de la versión n a la n+1. */
const MIGRATIONS: Record<number, Migration> = {};

/** Rellena campos que falten con los del estado inicial (guardados de builds anteriores). */
function fillDefaults(raw: Record<string, unknown>): GameState {
  const base = initialState(1) as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base, ...raw };
  for (const k of Object.keys(base)) {
    const b = base[k];
    const r = raw[k];
    if (b && typeof b === 'object' && !Array.isArray(b) && r && typeof r === 'object' && !Array.isArray(r)) {
      out[k] = { ...(b as object), ...(r as object) };
    }
  }
  return out as unknown as GameState;
}

export function serialize(s: GameState): string {
  const env: Envelope = { version: SAVE_VERSION, savedAt: Date.now(), state: s };
  return JSON.stringify(env);
}

export function deserialize(text: string): GameState {
  const env = JSON.parse(text) as Envelope;
  if (!env || typeof env !== 'object' || !env.state) throw new Error('Guardado no válido');
  let st = env.state as unknown as Record<string, unknown>;
  let v = env.version ?? 1;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (m) st = m(st);
    v++;
  }
  const s = fillDefaults(st);
  s.version = SAVE_VERSION;
  return s;
}

export function exportSave(s: GameState): string {
  const bytes = new TextEncoder().encode(serialize(s));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function importSave(b64: string): GameState {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return deserialize(new TextDecoder().decode(bytes));
}

export function saveToStorage(s: GameState, storage: Storage = localStorage): void {
  try {
    storage.setItem(SAVE_KEY, serialize(s));
  } catch {
    /* almacenamiento lleno o bloqueado: no pasa nada */
  }
}

export function loadFromStorage(storage: Storage = localStorage): GameState | null {
  try {
    const t = storage.getItem(SAVE_KEY);
    return t ? deserialize(t) : null;
  } catch {
    return null;
  }
}

export function clearStorage(storage: Storage = localStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    /* nada */
  }
}
