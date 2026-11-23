// Dibujo con rectángulos de cada slot. Coordenadas relativas al origen del slot.
// Cuando exista el sprite `<slot>.<variante>` en el manifiesto, sustituye a esto.
import { OFFICE_EXTRA as O, PALETTE as P } from './palette';
import type { SceneId } from './scenes';
import type { SceneData } from './variants';

export interface RectShape {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  /** Parpadeo CSS (respeta prefers-reduced-motion). */
  blink?: 1 | 2;
  /** Solo visible en este frame (animación por frames a 4 fps). */
  frame?: number;
}

export interface TextShape {
  text: string;
  x: number;
  y: number;
  size: number;
  fill: string;
  anchor?: 'start' | 'middle' | 'end';
}

export interface LineShape {
  points: string;
  stroke: string;
  width: number;
}

export type Shape = RectShape | TextShape | LineShape;

export const isText = (s: Shape): s is TextShape => 'text' in s;
export const isLine = (s: Shape): s is LineShape => 'points' in s;

type Painter = (variant: string, d: SceneData) => Shape[];

const r = (x: number, y: number, w: number, h: number, fill: string, extra: Partial<RectShape> = {}): RectShape => ({
  x,
  y,
  w,
  h,
  fill,
  ...extra,
});
const t = (text: string, x: number, y: number, size: number, fill: string, anchor?: TextShape['anchor']): TextShape => ({
  text,
  x,
  y,
  size,
  fill,
  anchor,
});

function person(x: number, y: number, shirt: string, hair: string, frameOffset = 0): Shape[] {
  // Persona pequeña sentada de perfil, tecleando (2 frames).
  return [
    r(x + 2, y, 6, 6, P.skin),
    r(x + 2, y - 1, 6, 2, hair),
    r(x + 1, y + 6, 8, 8, shirt),
    r(x + 9, y + 9, 4, 2, P.skin, { frame: frameOffset % 2 }),
    r(x + 9, y + 10, 4, 2, P.skin, { frame: (frameOffset + 1) % 2 }),
    r(x + 2, y + 14, 3, 6, P.denim),
  ];
}

const garage: Record<string, Painter> = {
  garage_bg: () => [
    r(0, 0, 400, 92, P.wall),
    r(0, 40, 400, 1, P.wallLine),
    r(0, 66, 400, 1, P.wallLine),
    r(0, 92, 400, 18, P.floor),
    r(0, 92, 400, 2, P.floorEdge),
  ],
  garage_door: () => [
    r(0, 0, 86, 78, P.slate),
    ...[8, 18, 28, 38, 48, 58, 68].map((y) => r(0, y, 86, 2, P.slateDark)),
    r(39, 72, 8, 2, P.grey),
  ],
  annotators: (v) => {
    const n = Number(v);
    if (n === 0) return [];
    const shapes: Shape[] = [
      // mesa plegable
      r(0, 20, 74, 3, P.metalLight),
      r(4, 23, 2, 11, P.grey),
      r(68, 23, 2, 11, P.grey),
    ];
    const shirts = [P.teal, P.pink, P.yellow, P.purple];
    for (let i = 0; i < n; i++) {
      const px = 4 + i * 17;
      shapes.push(...person(px, 6, shirts[i], P.hair, i));
      shapes.push(r(px + 11, 16, 6, 4, P.metal), r(px + 12, 17, 4, 2, P.teal, { blink: ((i % 2) + 1) as 1 | 2 }));
    }
    return shapes;
  },
  pizza_boxes: (v) => {
    const n = Number(v);
    const s: Shape[] = [r(0, 16, 30, 6, P.cardboard)];
    if (n >= 2) s.push(r(2, 12, 26, 4, P.cardboardDark));
    if (n >= 3) s.push(r(4, 8, 22, 4, P.cardboard));
    return s;
  },
  whiteboard: (v) => [
    r(0, 0, 76, 42, P.grey),
    r(2, 2, 72, 38, P.paper),
    t('PLAN', 38, 11, 6, O.marker, 'middle'),
    ...(v === '0'
      ? [t('1. fingir IA', 8, 20, 5, O.ink), t('2. comprar GPU', 8, 28, 5, O.ink), t('3. ???', 8, 36, 5, O.ink)]
      : [t('1. comprar GPU', 8, 20, 5, O.ink), t('2. ???', 8, 28, 5, O.ink), t('3. AGI / IPO', 8, 36, 5, O.ink)]),
  ],
  lamp: () => [r(3, 0, 1, 10, P.grey), r(0, 10, 7, 6, P.amber)],
  desk: () => [r(0, 0, 120, 5, P.wood), r(0, 5, 120, 2, P.woodDark), r(4, 7, 4, 19, P.woodDark), r(112, 7, 4, 19, P.woodDark)],
  laptop: (v) => [
    r(4, 0, 30, 20, P.metal),
    r(6, 2, 26, 16, P.screen),
    ...(v === 'typing'
      ? [r(8, 5, 16, 2, P.teal), r(8, 9, 20, 2, P.teal), r(8, 13, 10, 2, P.amber, { blink: 1 })]
      : [r(8, 5, 12, 2, P.border), r(8, 13, 2, 2, P.amber, { blink: 1 })]),
    r(0, 18, 38, 2, P.metalLight),
  ],
  mug: () => [r(0, 0, 6, 8, P.paper), r(6, 2, 2, 4, P.paper)],
  founder: (v) => {
    const chair = [r(32, 10, 4, 26, P.chair), r(12, 34, 24, 4, P.chair), r(22, 38, 4, 26, P.chair), r(14, 60, 20, 2, P.chair)];
    const body = [
      r(14, 16, 16, 18, P.amber),
      r(16, 34, 6, 22, P.denim),
      r(14, 56, 8, 4, P.screen),
      r(15, 2, 14, 14, P.skin),
      r(15, 0, 14, 5, P.hair),
      r(26, 5, 3, 8, P.hair),
    ];
    if (v === 'panic') {
      return [
        ...chair,
        ...body,
        // brazos arriba, ojos muy abiertos, gota de sudor
        r(10, 4, 4, 14, P.amber),
        r(10, 1, 4, 3, P.skin),
        r(30, 4, 4, 14, P.amber),
        r(30, 1, 4, 3, P.skin),
        r(16, 7, 3, 3, P.paper),
        r(17, 8, 1, 1, P.screen),
        r(19, 12, 4, 2, P.screen),
        r(13, 10, 2, 3, P.teal, { blink: 1 }),
      ];
    }
    const typing = v === 'typing';
    return [
      ...chair,
      ...body,
      r(2, 22, 14, 4, P.amber),
      r(0, typing ? 21 : 22, 3, 4, P.skin, typing ? { frame: 0 } : {}),
      ...(typing ? [r(0, 23, 3, 4, P.skin, { frame: 1 })] : []),
      r(17, 8, 2, 2, P.screen),
    ];
  },
  gpu_rack: (v) => {
    const n = Number(v);
    const shapes: Shape[] = [r(0, 0, 46, 62, P.rack)];
    const shelves = [4, 18, 32, 46];
    shelves.forEach((y, i) => {
      shapes.push(r(4, y, 38, 12, P.rackShelf));
      if (i < n) {
        shapes.push(
          r(8, y + 4, 3, 3, P.teal, { blink: ((i % 2) + 1) as 1 | 2 }),
          r(13, y + 4, 3, 3, i === 3 ? P.red : P.amber, { blink: (((i + 1) % 2) + 1) as 1 | 2 }),
          r(24, y + 2, 14, 8, P.card),
        );
      }
    });
    return shapes;
  },
  smoke: (v) =>
    v === 'on'
      ? [
          r(10, 12, 8, 6, P.grey, { frame: 0 }),
          r(14, 6, 10, 6, P.metal, { frame: 0 }),
          r(20, 0, 8, 5, P.metalLight, { frame: 0 }),
          r(12, 10, 10, 7, P.metal, { frame: 1 }),
          r(18, 4, 9, 6, P.grey, { frame: 1 }),
          r(8, 0, 8, 5, P.metalLight, { frame: 1 }),
        ]
      : [],
  power_strip: () => [r(0, 0, 16, 4, P.paper), r(16, 1, 6, 2, P.screen)],
  sticky_note: (v, d) => [
    r(0, 0, 24, 20, v === 'broke' ? '#f39b8b' : P.yellow),
    t('caja:', 3, 8, 4.5, O.note),
    t(d.text.runway, 3, 15, 4.5, v === 'ok' ? O.note : O.marker),
  ],
  data_box: (v) => {
    const s: Shape[] = [r(0, 0, 30, 32, P.purple), r(2, 2, 26, 12, P.purpleDark), t('datos', 15, 10, 4, '#a7a1b8', 'middle')];
    if (v !== 'empty') s.push(r(4, 18, 10, 4, P.card), r(5, 19, 2, 2, P.teal, { blink: 2 }));
    if (v === 'full') s.push(r(16, 18, 10, 4, P.card), r(4, 24, 10, 4, P.card), r(16, 24, 10, 4, P.card), r(17, 25, 2, 2, P.teal, { blink: 1 }));
    return s;
  },
};

function officePerson(skin: string, hair: string, shirt: string, legs: string, dx: number): Shape[] {
  return [
    r(dx + 1, 0, 10, 3, hair),
    r(dx + 1, 2, 10, 10, skin),
    r(dx, 12, 12, 14, shirt),
    r(dx + 1, 26, 4, 22, legs),
    r(dx + 7, 26, 4, 22, legs),
  ];
}

const office: Record<string, Painter> = {
  office_bg: () => [r(0, 0, 400, 92, O.lilac), r(0, 92, 400, 18, O.carpet), r(0, 92, 400, 2, O.carpetEdge), r(0, 100, 400, 1, '#c9b08e')],
  neon_sign: (v) => [
    r(0, 0, 104, 20, P.wall),
    ...(v === 'hot' ? [r(2, 2, 100, 1, O.neon, { blink: 1 }), r(2, 17, 100, 1, O.neon, { blink: 2 })] : []),
    t('MOVE FAST, RAISE ROUNDS', 52, 13, 6.5, O.neon, 'middle'),
  ],
  poufs: (v) => [
    r(0, 14, 28, 12, O.pouf),
    r(4, 10, 20, 4, O.pouf),
    r(8, 8, 12, 2, O.poufLight),
    r(32, 16, 24, 10, O.mint),
    r(36, 12, 16, 4, O.mint),
    ...(v === 'busy' ? [r(12, 2, 8, 8, P.skin), r(12, 0, 8, 3, '#7a4a2a'), r(10, 10, 12, 6, O.sky), r(20, 9, 6, 4, P.metal, { frame: 0 }), r(20, 10, 6, 4, P.metal, { frame: 1 })] : []),
  ],
  pingpong: (v) => [
    r(0, 8, 62, 4, O.table),
    r(30, 4, 2, 4, O.white),
    r(4, 12, 3, 16, P.border),
    r(55, 12, 3, 16, P.border),
    ...(v === 'play' ? [r(14, 0, 3, 3, O.white, { frame: 0 }), r(44, 1, 3, 3, O.white, { frame: 1 })] : [r(16, 2, 3, 3, O.white)]),
  ],
  valuation_screen: (v) => [
    r(0, 0, 70, 40, P.border),
    r(3, 3, 64, 34, P.screen),
    t('valoración', 6, 10, 4.5, '#a7a1b8'),
    v === 'up'
      ? { points: '6,32 18,30 28,28 38,22 48,18 56,12 64,7', stroke: P.amber, width: 2 }
      : { points: '6,12 18,15 28,14 38,21 48,24 56,29 64,32', stroke: '#ff8a8a', width: 2 },
  ],
  standing_desk: () => [
    r(18, 0, 6, 10, P.border),
    r(0, 10, 44, 4, O.white),
    r(4, 14, 3, 26, P.metalLight),
    r(37, 14, 3, 26, P.metalLight),
    r(8, 2, 16, 8, P.metal),
    r(10, 4, 12, 4, P.teal, { blink: 1 }),
  ],
  engineer: (v) => [
    ...officePerson(P.skinDark, P.screen, O.white, P.denim, 1),
    ...(v === 'typing' ? [r(-6, 15, 8, 2, P.skinDark, { frame: 0 }), r(-6, 16, 8, 2, P.skinDark, { frame: 1 })] : []),
  ],
  founder: (v) =>
    v === 'panic'
      ? [...officePerson(P.skin, O.blond, P.amber, P.wall, 15), r(11, 2, 4, 12, P.amber), r(27, 2, 4, 12, P.amber), r(11, 0, 4, 2, P.skin), r(27, 0, 4, 2, P.skin), r(18, 6, 2, 2, P.screen), r(13, 8, 2, 3, P.teal, { blink: 1 })]
      : [...officePerson(P.skin, O.blond, P.amber, P.wall, 15), r(8, 16, 7, 2, P.skin), r(0, 14, 8, 6, P.paper), ...(v === 'typing' ? [r(2, 10, 1, 3, P.metalLight, { frame: 0 }), r(4, 9, 1, 3, P.metalLight, { frame: 1 })] : [])],
  plant: () => [r(4, 20, 8, 20, '#7a4a2a'), r(0, 6, 16, 14, O.plant), r(4, 0, 8, 6, O.plant)],
  server_room: (v) => {
    const n = Number(v);
    const shapes: Shape[] = [r(0, 0, 120, 82, O.glass), r(0, 0, 120, 2, O.glassEdge), r(0, 0, 2, 82, O.glassEdge)];
    [8, 36, 64, 92].forEach((x, i) => {
      if (i >= n) {
        shapes.push(r(x, 12, 22, 70, O.glassEdge));
        return;
      }
      shapes.push(
        r(x, 12, 22, 70, P.rack),
        r(x + 4, 18, 3, 3, P.teal, { blink: ((i % 2) + 1) as 1 | 2 }),
        r(x + 4, 30, 3, 3, i === 3 ? P.red : P.teal, { blink: (((i + 1) % 2) + 1) as 1 | 2 }),
        r(x + 4, 42, 3, 3, P.amber),
        r(x + 8, 54, 10, 2, P.card),
      );
    });
    shapes.push(r(18, 4, 80, 6, O.white), t('SALA DE GPUS · NO ENTRAR', 58, 8.8, 4, P.border, 'middle'));
    return shapes;
  },
  servers_smoke: (v) =>
    v === 'on'
      ? [
          r(10, 12, 12, 8, P.grey, { frame: 0 }),
          r(30, 6, 14, 8, P.metal, { frame: 0 }),
          r(54, 10, 12, 8, P.grey, { frame: 0 }),
          r(16, 6, 12, 8, P.metal, { frame: 1 }),
          r(40, 10, 14, 8, P.grey, { frame: 1 }),
          r(60, 2, 12, 8, P.metalLight, { frame: 1 }),
        ]
      : [],
};

export const PLACEHOLDERS: Record<SceneId, Record<string, Painter>> = {
  garage,
  office,
  campus: {},
  ending: {},
};

export function placeholderShapes(scene: SceneId, slot: string, variant: string, d: SceneData): Shape[] {
  return PLACEHOLDERS[scene][slot]?.(variant, d) ?? [];
}
