// Definición de cada escena: huecos (slots) con nombre, posición, tamaño y capa.
// Resolución lógica fija: 400 × 110 px.

export const SCENE_W = 400;
export const SCENE_H = 110;

export type SceneId = 'garage' | 'office' | 'campus' | 'ending';

export interface SlotDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  /** Descripción para el generador de assets y para lectores de pantalla. */
  desc: string;
  /** Panel que se abre al hacer clic (opcional). */
  panel?: string;
  /** Variantes posibles (para el generador de assets). */
  variants?: string[];
}

export interface SceneDef {
  id: SceneId;
  title: string;
  background: string;
  slots: SlotDef[];
}

export const SCENES: Record<SceneId, SceneDef> = {
  garage: {
    id: 'garage',
    title: 'El garaje',
    background: '#2a2438',
    slots: [
      { id: 'garage_bg', x: 0, y: 0, w: 400, h: 110, z: 0, desc: 'pared violeta oscura de garaje y suelo de cemento marrón' },
      { id: 'garage_door', x: 10, y: 14, w: 86, h: 78, z: 1, desc: 'puerta de garaje enrollable cerrada' },
      { id: 'annotators', x: 18, y: 58, w: 74, h: 34, z: 2, desc: 'anotadores humanos tecleando en una mesa plegable', variants: ['0', '1', '2', '3', '4'], panel: 'fake' },
      { id: 'pizza_boxes', x: 104, y: 70, w: 30, h: 22, z: 2, desc: 'pila de cajas de pizza', variants: ['1', '2', '3'] },
      { id: 'whiteboard', x: 118, y: 14, w: 76, h: 42, z: 1, desc: 'pizarra blanca con el plan de negocio', variants: ['0', '1'] },
      { id: 'lamp', x: 197, y: 0, w: 7, h: 16, z: 1, desc: 'bombilla colgante con pantalla ámbar' },
      { id: 'desk', x: 150, y: 66, w: 120, h: 26, z: 3, desc: 'mesa de madera' },
      { id: 'laptop', x: 164, y: 46, w: 38, h: 20, z: 4, desc: 'portátil abierto con código en pantalla', variants: ['idle', 'typing'] },
      { id: 'mug', x: 250, y: 58, w: 8, h: 8, z: 4, desc: 'taza de café' },
      { id: 'founder', x: 200, y: 28, w: 36, h: 64, z: 4, desc: 'la fundadora sentada en una silla de oficina', variants: ['idle', 'typing', 'panic'] },
      { id: 'gpu_rack', x: 290, y: 30, w: 46, h: 62, z: 2, desc: 'rack casero de GPUs con LEDs', variants: ['0', '1', '2', '3', '4'], panel: 'compute' },
      { id: 'smoke', x: 296, y: 10, w: 34, h: 20, z: 5, desc: 'humo saliendo del rack', variants: ['off', 'on'] },
      { id: 'power_strip', x: 268, y: 88, w: 22, h: 4, z: 3, desc: 'regleta en el suelo' },
      { id: 'sticky_note', x: 345, y: 22, w: 24, h: 20, z: 2, desc: 'pósit amarillo con la caja que queda', variants: ['ok', 'low', 'broke'] },
      { id: 'data_box', x: 356, y: 60, w: 30, h: 32, z: 2, desc: 'caja de cartón con discos duros de datos', variants: ['empty', 'some', 'full'], panel: 'data' },
    ],
  },
  office: {
    id: 'office',
    title: 'La oficina',
    background: '#f4e9ff',
    slots: [
      { id: 'office_bg', x: 0, y: 0, w: 400, h: 110, z: 0, desc: 'oficina de scale-up con pared lila y moqueta beige' },
      { id: 'neon_sign', x: 20, y: 12, w: 104, h: 20, z: 1, desc: 'letrero de neón rosa "MOVE FAST, RAISE ROUNDS"', variants: ['on', 'hot'], panel: 'hype' },
      { id: 'poufs', x: 18, y: 66, w: 56, h: 26, z: 2, desc: 'pufs de colores con un empleado sentado con portátil', variants: ['empty', 'busy'] },
      { id: 'pingpong', x: 84, y: 64, w: 62, h: 28, z: 2, desc: 'mesa de ping-pong que nadie usa', variants: ['idle', 'play'] },
      { id: 'valuation_screen', x: 154, y: 12, w: 70, h: 40, z: 1, desc: 'pantalla grande con la gráfica de la valoración', variants: ['up', 'down'], panel: 'board' },
      { id: 'standing_desk', x: 168, y: 52, w: 44, h: 40, z: 2, desc: 'mesa alta con un portátil y su pie de pantalla' },
      { id: 'engineer', x: 194, y: 38, w: 14, h: 48, z: 3, desc: 'ingeniero de pie con camiseta blanca', variants: ['idle', 'typing'] },
      { id: 'founder', x: 214, y: 38, w: 28, h: 48, z: 3, desc: 'la fundadora con camiseta ámbar y un café', variants: ['idle', 'typing', 'panic'] },
      { id: 'plant', x: 248, y: 52, w: 16, h: 40, z: 2, desc: 'planta en maceta' },
      { id: 'server_room', x: 272, y: 10, w: 120, h: 82, z: 1, desc: 'sala de servidores acristalada con racks y LEDs', variants: ['1', '2', '3', '4'], panel: 'compute' },
      { id: 'servers_smoke', x: 290, y: 0, w: 80, h: 22, z: 4, desc: 'humo saliendo de la sala de servidores', variants: ['off', 'on'] },
    ],
  },
  campus: {
    id: 'campus',
    title: 'El campus',
    background: '#1b1830',
    slots: [
      { id: 'campus_bg', x: 0, y: 0, w: 400, h: 110, z: 0, desc: 'cielo nocturno violeta con estrellas y suelo de asfalto' },
      { id: 'datacenters', x: 8, y: 40, w: 132, h: 52, z: 2, desc: 'naves de centros de datos con rejillas de ventilación', variants: ['0', '1', '2', '3'], panel: 'datacenters' },
      { id: 'crane', x: 112, y: 6, w: 40, h: 86, z: 3, desc: 'grúa de obra', variants: ['off', 'on'] },
      { id: 'hq', x: 158, y: 14, w: 86, h: 78, z: 2, desc: 'sede de OwnAI: edificio de cristal con el logo en ámbar', variants: ['calm', 'hype'], panel: 'hype' },
      { id: 'chip_fab', x: 250, y: 52, w: 36, h: 40, z: 2, desc: 'pequeña fábrica de chips con un chip dibujado', variants: ['none', 'building', 'done'], panel: 'datacenters' },
      { id: 'power', x: 292, y: 20, w: 104, h: 72, z: 1, desc: 'paneles solares y torre de refrigeración nuclear', variants: ['grid', 'solar', 'nuclear', 'both'], panel: 'datacenters' },
      { id: 'protest', x: 170, y: 86, w: 70, h: 20, z: 4, desc: 'manifestantes con pancartas delante de la sede', variants: ['off', 'on'], panel: 'regulation' },
      { id: 'smoke', x: 20, y: 22, w: 80, h: 18, z: 4, desc: 'humo saliendo de los centros de datos', variants: ['off', 'on'] },
    ],
  },
  ending: {
    id: 'ending',
    title: 'Fin',
    background: '#14121a',
    slots: [
      { id: 'ending_bg', x: 0, y: 0, w: 400, h: 110, z: 0, desc: 'fondo del final', variants: ['light', 'dark'] },
      { id: 'centerpiece', x: 150, y: 10, w: 100, h: 82, z: 1, desc: 'símbolo del final', variants: ['agi', 'agiUnsafe', 'ipo', 'acquired', 'shutdown', 'bubble'] },
      { id: 'founder', x: 262, y: 50, w: 20, h: 42, z: 2, desc: 'la fundadora mirando', variants: ['happy', 'sad', 'gone'] },
    ],
  },
};

export function sceneForPhase(phase: number): SceneId {
  if (phase <= 1) return 'garage';
  if (phase === 2) return 'office';
  if (phase === 3) return 'campus';
  return 'ending';
}
