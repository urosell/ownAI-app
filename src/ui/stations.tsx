// Estaciones: cada objeto del mundo abre una estación con sus paneles.
// El mundo (3D o escena antigua) y el dock solo saben de ids; aquí se decide qué se ve.
import type { ReactNode } from 'react';
import type { GameState } from '../engine/state';
import { Desktop } from './desktop/Desktop';
import { InboxPanel, InvestorsPanel, TeamPanel } from './panels/FakePanels';
import { AutomationPanel, AutoNotice, DatacentersPanel, EvalButton, IpoPanel, RegulationPanel, SafetyPanel } from './panels/FrontierPanels';
import { ComputePanel, DataPanel, ProductPanel, ResearchPanel } from './panels/GaragePanels';
import {
  ApiPanel,
  ArchitectureButton,
  BoardPanel,
  ContractsPanel,
  DatacenterComputePanel,
  HypePanel,
  ModelsPanel,
  PretrainPanel,
  TalentPanel,
} from './panels/ScaleupPanels';
import { TrainingPanel } from './panels/TrainingPanel';
import { LogPanel } from './LogPanel';
import { DEBUG, DebugPanel, SaveBar } from './DebugPanel';
import type { Dispatch } from './types';

const PHASE2_UPGRADES = ['checkpoints', 'monitoring', 'fastNetwork', 'synthetic', 'reasoning', 'ownCluster'];

export interface Station {
  id: string;
  label: string;
  icon: string;
  show: (s: GameState) => boolean;
  render: (s: GameState, d: Dispatch) => ReactNode;
}

const garage = (s: GameState) => s.phase <= 1;
const p1 = (s: GameState) => s.phase === 1;
const p2 = (s: GameState) => s.phase >= 2;
const p3 = (s: GameState) => s.phase >= 3;

export const STATIONS: Station[] = [
  // ── Garaje (Fases 0–1) ──
  { id: 'pc', label: 'Ordenador', icon: '🖥️', show: garage, render: (s, d) => <Desktop s={s} d={d} /> },
  {
    id: 'rack',
    label: 'GPUs',
    icon: '🧱',
    show: garage,
    render: (s, d) =>
      s.phase === 0 ? (
        <InvestorsPanel s={s} d={d} />
      ) : (
        <>
          <TrainingPanel s={s} d={d} />
          <ComputePanel s={s} d={d} />
        </>
      ),
  },
  { id: 'annotators', label: 'Anotadores', icon: '✍️', show: garage, render: (s, d) => <TeamPanel s={s} d={d} /> },
  { id: 'data', label: 'Datos', icon: '📦', show: (s) => s.phase >= 1, render: (s, d) => <DataPanel s={s} d={d} /> },
  { id: 'whiteboard', label: 'Investigación', icon: '📋', show: p1, render: (s, d) => <ResearchPanel s={s} d={d} /> },
  { id: 'door', label: 'Producto', icon: '🚪', show: (s) => p1(s) || (p2(s) && !!s.niche), render: (s, d) => <ProductPanel s={s} d={d} /> },

  // ── Oficina y campus (Fase 2+) ──
  {
    id: 'models',
    label: 'Modelos',
    icon: '🧠',
    show: p2,
    render: (s, d) =>
      s.automation.autoTrain ? (
        <AutoNotice title="Preentrenamiento" text="El modelo planifica, entrena, ajusta y lanza a sus sucesores. Tú firmas." />
      ) : (
        <>
          <PretrainPanel s={s} d={d} />
          <ModelsPanel s={s} d={d} evalButton={(id) => <EvalButton s={s} d={d} id={id} />} />
        </>
      ),
  },
  {
    id: 'compute',
    label: 'Computación',
    icon: '🗄️',
    show: p2,
    render: (s, d) =>
      s.automation.autoBuy ? (
        <AutoNotice title="Computación y energía" text="El modelo compra GPUs, megavatios y terrenos. A veces en países que no conocías." />
      ) : (
        <>
          <DatacenterComputePanel s={s} d={d} />
          {s.phase >= 3 && <DatacentersPanel s={s} d={d} />}
        </>
      ),
  },
  {
    id: 'api',
    label: 'Negocio',
    icon: '💶',
    show: p2,
    render: (s, d) => (
      <>
        <ApiPanel s={s} d={d} />
        <ContractsPanel s={s} d={d} />
      </>
    ),
  },
  {
    id: 'hype',
    label: 'Hype',
    icon: '📣',
    show: p2,
    render: (s, d) => (
      <>
        <HypePanel s={s} d={d} />
        {s.phase >= 3 && <IpoPanel s={s} d={d} />}
      </>
    ),
  },
  { id: 'board', label: 'Junta', icon: '🪑', show: p2, render: (s) => <BoardPanel s={s} /> },
  {
    id: 'research',
    label: 'Investigación',
    icon: '🔬',
    show: p2,
    render: (s, d) => (
      <>
        {s.automation.autoResearch ? (
          <AutoNotice title="Investigación" text="El modelo investiga solo. Las ideas llegan al doble de velocidad y nadie entiende los papers." />
        ) : (
          <ResearchPanel s={s} d={d} upgrades={PHASE2_UPGRADES}>
            <ArchitectureButton s={s} d={d} />
          </ResearchPanel>
        )}
        <TalentPanel s={s} d={d} />
      </>
    ),
  },
  {
    id: 'frontier',
    label: 'Seguridad',
    icon: '🛡️',
    show: p3,
    render: (s, d) => (
      <>
        <AutomationPanel s={s} d={d} />
        <SafetyPanel s={s} d={d} />
        <RegulationPanel s={s} d={d} />
      </>
    ),
  },
  // Inbox fuera del PC solo como atajo en Fase 0 (es lo único que hay).
  { id: 'inbox', label: 'Prompts', icon: '💬', show: (s) => s.phase === 0, render: (s, d) => <InboxPanel s={s} d={d} /> },
  { id: 'log', label: 'Registro', icon: '📜', show: () => true, render: (s) => <LogPanel s={s} /> },
  {
    id: 'game',
    label: 'Partida',
    icon: '⚙️',
    show: () => true,
    render: (s, d) => (
      <>
        <SaveBar s={s} />
        {DEBUG && <DebugPanel s={s} d={d} />}
      </>
    ),
  },
];

/** Ids de paneles de la escena antigua → estación. */
const LEGACY: Record<string, string> = {
  fake: 'annotators',
  compute: 'compute',
  datacenters: 'compute',
  data: 'data',
  hype: 'hype',
  board: 'board',
  regulation: 'frontier',
};

export function stationFor(panelOrStation: string): string {
  return LEGACY[panelOrStation] ?? panelOrStation;
}

export function visibleStations(s: GameState): Station[] {
  return STATIONS.filter((x) => x.show(s));
}
