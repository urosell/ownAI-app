import { useEffect } from 'react';
import type { GameState } from '../engine/state';
import { SceneView } from '../scene/SceneView';
import { SCENES, sceneForPhase } from '../scene/scenes';
import { DEBUG, DebugPanel, SaveBar } from './DebugPanel';
import { EndingScreen } from './EndingScreen';
import { LogPanel } from './LogPanel';
import { Modals } from './Modal';
import { InboxPanel, InvestorsPanel, TeamPanel } from './panels/FakePanels';
import { AutomationPanel, AutoNotice, DatacentersPanel, EvalButton, IpoPanel, RegulationPanel, SafetyPanel } from './panels/FrontierPanels';
import { ComputePanel, DataPanel, ProductPanel, ResearchPanel } from './panels/GaragePanels';
import {
  ApiPanel,
  ArchitectureButton,
  BoardModal,
  BoardPanel,
  ContractsPanel,
  DatacenterComputePanel,
  HypePanel,
  ModelsPanel,
  PretrainPanel,
  TalentPanel,
} from './panels/ScaleupPanels';
import { TrainingPanel } from './panels/TrainingPanel';
import { startLoop, useGame } from './store';
import { TopBar } from './TopBar';
import type { Dispatch } from './types';

const PHASE2_UPGRADES = ['checkpoints', 'monitoring', 'fastNetwork', 'synthetic', 'reasoning', 'ownCluster'];

function scrollToPanel(id: string) {
  document.getElementById(`panel-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function caption(s: GameState): string {
  const scene = SCENES[sceneForPhase(s.phase)];
  if (s.phase <= 1) return `${scene.title} · día ${Math.floor(s.t / 24) + 1}`;
  if (s.phase >= 4) return 'Fin de la partida';
  return `${scene.title} · trimestre ${s.board.quarter}`;
}

function Panels({ s, d }: { s: GameState; d: Dispatch }) {
  const a = s.automation;
  return (
    <>
      {s.phase === 1 && (
        <>
          <TrainingPanel s={s} d={d} />
          <ComputePanel s={s} d={d} />
          <DataPanel s={s} d={d} />
          <ProductPanel s={s} d={d} />
          <ResearchPanel s={s} d={d} />
        </>
      )}
      {s.phase >= 2 && (
        <>
          {a.autoTrain ? (
            <AutoNotice title="Preentrenamiento" text="El modelo planifica, entrena, ajusta y lanza a sus sucesores. Tú firmas." />
          ) : (
            <PretrainPanel s={s} d={d} />
          )}
          <HypePanel s={s} d={d} />
          {s.phase >= 3 && <IpoPanel s={s} d={d} />}
          {!a.autoTrain && <ModelsPanel s={s} d={d} evalButton={(id) => <EvalButton s={s} d={d} id={id} />} />}
          <ApiPanel s={s} d={d} />
          <BoardPanel s={s} />
          <ContractsPanel s={s} d={d} />
          {s.phase >= 3 && <AutomationPanel s={s} d={d} />}
          {s.phase >= 3 && <SafetyPanel s={s} d={d} />}
          {s.phase >= 3 && <RegulationPanel s={s} d={d} />}
          {a.autoBuy ? (
            <AutoNotice title="Computación y energía" text="El modelo compra GPUs, megavatios y terrenos. A veces en países que no conocías." />
          ) : (
            <>
              <DatacenterComputePanel s={s} d={d} />
              {s.phase >= 3 && <DatacentersPanel s={s} d={d} />}
            </>
          )}
          <TalentPanel s={s} d={d} />
          {a.autoResearch ? (
            <AutoNotice title="Investigación" text="El modelo investiga solo. Las ideas llegan al doble de velocidad y nadie entiende los papers." />
          ) : (
            <ResearchPanel s={s} d={d} upgrades={PHASE2_UPGRADES}>
              <ArchitectureButton s={s} d={d} />
            </ResearchPanel>
          )}
          <DataPanel s={s} d={d} />
          {s.niche && <ProductPanel s={s} d={d} />}
        </>
      )}
      {s.phase <= 1 && (
        <>
          <InboxPanel s={s} d={d} />
          <TeamPanel s={s} d={d} />
          <InvestorsPanel s={s} d={d} />
        </>
      )}
    </>
  );
}

export function App() {
  const s = useGame((x) => x.game);
  const d = useGame((x) => x.dispatch);
  const manifest = useGame((x) => x.manifest);
  const newGame = useGame((x) => x.newGame);
  useEffect(() => startLoop(), []);

  return (
    <div className="min-h-screen p-3 sm:p-6 box-border">
      <div className="max-w-[1232px] mx-auto flex flex-col gap-4">
        <TopBar s={s} />

        <section className="relative border-2 border-line" aria-label="Escena">
          <div className="absolute top-2.5 left-3 z-10 font-pixel text-[13px] text-ink bg-void px-2 py-1">{caption(s)}</div>
          <SceneView state={s} manifest={manifest} onSlotClick={scrollToPanel} />
        </section>

        {s.ending ? (
          <EndingScreen s={s} onNewGame={newGame} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            <div className="flex flex-wrap gap-4 min-w-0">
              <Panels s={s} d={d} />
              {DEBUG && <DebugPanel s={s} d={d} />}
            </div>
            <aside className="lg:sticky lg:top-28">
              <LogPanel s={s} />
            </aside>
          </div>
        )}

        <SaveBar s={s} />
      </div>
      <Modals s={s} d={d} extra={<BoardModal s={s} d={d} />} />
    </div>
  );
}
