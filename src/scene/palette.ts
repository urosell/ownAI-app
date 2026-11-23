// Paleta común "ownai-32", sacada de la maqueta. Todos los sprites deben usarla.
export const PALETTE = {
  // fondos violetas
  void: '#14121a',
  panel: '#1f1c29',
  wall: '#2a2438',
  wallLine: '#251f33',
  border: '#3a3450',
  slate: '#3f3a4f',
  slateDark: '#34304a',
  purple: '#4a3f60',
  purpleDark: '#3a3150',
  chair: '#39304a',
  // suelo y madera
  floor: '#3a2e2a',
  floorEdge: '#4a3a33',
  wood: '#8b5a2b',
  woodDark: '#6e4520',
  cardboard: '#d9a066',
  cardboardDark: '#c48b52',
  // metal y máquinas
  grey: '#8a8296',
  metal: '#9aa0a6',
  metalLight: '#b8bcc4',
  rack: '#2f3442',
  rackShelf: '#232733',
  card: '#3d4455',
  screen: '#1b1f2a',
  // acentos
  amber: '#F5A623',
  teal: '#5fd3bc',
  red: '#e05252',
  pink: '#ff6fa8',
  yellow: '#f7d774',
  // personas y oficina
  skin: '#f1c27d',
  skinDark: '#c68642',
  hair: '#3b2a20',
  denim: '#3d4f7a',
  paper: '#ece8dc',
} as const;

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE];

/** Colores extra de la oficina (pasteles). Se mantienen aparte para no pasar de 32 en el garaje. */
export const OFFICE_EXTRA = {
  lilac: '#f4e9ff',
  carpet: '#d9c2a3',
  carpetEdge: '#c4a983',
  pouf: '#ff8fb7',
  poufLight: '#ffadc9',
  mint: '#8fd6c9',
  sky: '#8fb4ff',
  glass: '#cfe3f2',
  glassEdge: '#9cb8cc',
  plant: '#4caf6e',
  table: '#2f7d6b',
  white: '#ffffff',
  neon: '#ff5fa2',
  blond: '#e8c14a',
  ink: '#2d4f9e',
  marker: '#b03a2e',
  note: '#5a4a12',
} as const;
