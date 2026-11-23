import { useEffect } from 'react';
import { SceneView } from '../scene/SceneView';
import { SCENES } from '../scene/scenes';
import { sceneForPhase } from '../scene/scenes';
import { DEBUG, DebugPanel, SaveBar } from './DebugPanel';
import { LogPanel } from './LogPanel';
import { Modals } from './Modal';
import { InboxPanel, InvestorsPanel, TeamPanel } from './panels/FakePanels';
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

const PHASE2_UPGRADES = ['checkpoints', 'monitoring', 'fastNetwork', 'synthetic', 'reasoning', 'ownCluster'];
import { startLoop, useGame } from './store';
import { TopBar } from './TopBar';

function scrollToPanel(id: string) {
  document.getElementById(`panel-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function App() {
  const s = useGame((x) => x.game);
  const d = useGame((x) => x.dispatch);
  const manifest = useGame((x) => x.manifest);
  useEffect(() => startLoop(), []);

  const scene = SCENES[sceneForPhase(s.phase)];
  const caption =
    s.phase <= 1 ? `${scene.title} · día ${Math.floor(s.t / 24) + 1}` : `${scene.title} · trimestre ${s.board.quarter}`;

  return (
    <div className="min-h-screen p-3 sm:p-6 box-border">
      <div className="max-w-[1232px] mx-auto flex flex-col gap-4">
        <TopBar s={s} />

        <section className="relative border-2 border-line" aria-label="Escena">
          <div className="absolute top-2.5 left-3 z-10 font-pixel text-[13px] text-ink bg-void px-2 py-1">{caption}</div>
          <SceneView state={s} manifest={manifest} onSlotClick={scrollToPanel} />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="flex flex-wrap gap-4 min-w-0">
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
                <PretrainPanel s={s} d={d} />
                <HypePanel s={s} d={d} />
                <ModelsPanel s={s} d={d} />
                <ApiPanel s={s} d={d} />
                <BoardPanel s={s} />
                <ContractsPanel s={s} d={d} />
                <DatacenterComputePanel s={s} d={d} />
                <TalentPanel s={s} d={d} />
                <ResearchPanel s={s} d={d} upgrades={PHASE2_UPGRADES}>
                  <ArchitectureButton s={s} d={d} />
                </ResearchPanel>
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
            {DEBUG && <DebugPanel s={s} d={d} />}
          </div>
          <aside className="lg:sticky lg:top-28">
            <LogPanel s={s} />
          </aside>
        </div>

        <SaveBar s={s} />
      </div>
      <Modals s={s} d={d} extra={<BoardModal s={s} d={d} />} />
    </div>
  );
}
