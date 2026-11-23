// Contrato con el futuro generador de assets (§14.3 y §15).

export type Anchor = 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-left' | 'top-right' | 'top-center' | 'center';

export interface SpriteDef {
  file: string;
  w: number;
  h: number;
  anchor?: Anchor;
  frames?: number;
  fps?: number;
}

export interface Manifest {
  version: number;
  palette: string;
  sprites: Record<string, SpriteDef>;
}

export const EMPTY_MANIFEST: Manifest = { version: 1, palette: 'ownai-32', sprites: {} };

/** Valida un manifiesto. Descarta entradas mal formadas en vez de romper. */
export function parseManifest(raw: unknown): Manifest {
  if (!raw || typeof raw !== 'object') return EMPTY_MANIFEST;
  const o = raw as Record<string, unknown>;
  const sprites: Record<string, SpriteDef> = {};
  const src = o.sprites && typeof o.sprites === 'object' ? (o.sprites as Record<string, unknown>) : {};
  for (const [name, v] of Object.entries(src)) {
    if (!v || typeof v !== 'object') continue;
    const d = v as Record<string, unknown>;
    if (typeof d.file !== 'string' || typeof d.w !== 'number' || typeof d.h !== 'number') continue;
    if (d.w <= 0 || d.h <= 0) continue;
    sprites[name] = {
      file: d.file,
      w: d.w,
      h: d.h,
      anchor: typeof d.anchor === 'string' ? (d.anchor as Anchor) : 'bottom-left',
      frames: typeof d.frames === 'number' && d.frames >= 1 ? Math.floor(d.frames) : 1,
      fps: typeof d.fps === 'number' && d.fps > 0 ? d.fps : 4,
    };
  }
  return {
    version: typeof o.version === 'number' ? o.version : 1,
    palette: typeof o.palette === 'string' ? o.palette : 'ownai-32',
    sprites,
  };
}

/** Busca `<slot>.<variante>` y, si no existe, `<slot>`. */
export function resolveSprite(m: Manifest, slot: string, variant: string | undefined): { name: string; sprite: SpriteDef } | null {
  if (variant !== undefined) {
    const name = `${slot}.${variant}`;
    if (m.sprites[name]) return { name, sprite: m.sprites[name] };
  }
  if (m.sprites[slot]) return { name: slot, sprite: m.sprites[slot] };
  return null;
}

/** Posición del sprite dentro del slot según su ancla. */
export function spritePosition(slot: { x: number; y: number; w: number; h: number }, sp: SpriteDef): { x: number; y: number } {
  const a = sp.anchor ?? 'bottom-left';
  let x = slot.x;
  let y = slot.y;
  if (a.endsWith('right')) x = slot.x + slot.w - sp.w;
  else if (a.endsWith('center') || a === 'center') x = slot.x + Math.round((slot.w - sp.w) / 2);
  if (a.startsWith('bottom')) y = slot.y + slot.h - sp.h;
  else if (a === 'center') y = slot.y + Math.round((slot.h - sp.h) / 2);
  return { x, y };
}

export async function loadManifest(url = `${import.meta.env?.BASE_URL ?? '/'}assets/manifest.json`): Promise<Manifest> {
  try {
    const res = await fetch(url);
    if (!res.ok) return EMPTY_MANIFEST;
    return parseManifest(await res.json());
  } catch {
    return EMPTY_MANIFEST;
  }
}
