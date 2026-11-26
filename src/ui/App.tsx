import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameState } from '../engine/state';
import { SceneView } from '../scene/SceneView';
import { SCENES, sceneForPhase } from '../scene/scenes';
import { EndingScreen } from './EndingScreen';
import { Modals } from './Modal';
import { BoardModal } from './panels/ScaleupPanels';
import { stationFor, STATIONS, visibleStations } from './stations';
import { startLoop, useGame } from './store';
import { TopBar } from './TopBar';
import type { Dispatch } from './types';

// three.js pesa: solo se descarga cuando hace falta el garaje 3D.
const Garage3D = lazy(() => import('../world/Garage3D'));

function caption(s: GameState): string {
  const scene = SCENES[sceneForPhase(s.phase)];
  if (s.phase <= 1) return `${scene.title} · día ${Math.floor(s.t / 24) + 1}`;
  if (s.phase >= 4) return 'Fin de la partida';
  return `${scene.title} · trimestre ${s.board.quarter}`;
}

/** Si el 3D falla (WebGL no disponible, etc.), se usa la escena antigua. */
class Fallback3D extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function World({ s, selected, onSelect }: { s: GameState; selected: string | null; onSelect: (id: string) => void }) {
  const manifest = useGame((x) => x.manifest);
  // Oficina y campus: escena antigua hasta que tengan su versión 3D.
  const flat = (
    <div className="absolute inset-0 grid place-items-center p-3">
      <div className="w-full max-w-[1100px] border-2 border-line">
        <SceneView state={s} manifest={manifest} onSlotClick={(p) => onSelect(stationFor(p))} maxHeight={360} />
      </div>
    </div>
  );
  if (s.phase <= 1) {
    return (
      <Fallback3D fallback={flat}>
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-muted">Amasando la plastilina…</div>}>
          <Garage3D s={s} selected={selected} onSelect={onSelect} />
        </Suspense>
      </Fallback3D>
    );
  }
  return flat;
}

function Dock({ s, selected, onSelect }: { s: GameState; selected: string | null; onSelect: (id: string) => void }) {
  const list = visibleStations(s);
  return (
    <nav aria-label="Estaciones" className="shrink-0 border-t-2 border-line bg-panel overflow-x-auto">
      <ul className="flex gap-1 m-0 p-1.5 list-none min-w-max mx-auto w-fit">
        {list.map((st) => {
          const on = st.id === selected;
          const badge = st.id === 'pc' || st.id === 'inbox' ? s.queue.length : 0;
          return (
            <li key={st.id}>
              <button
                type="button"
                onClick={() => onSelect(on ? '' : st.id)}
                aria-pressed={on}
                className={`relative flex flex-col items-center gap-0.5 min-w-16 px-2 py-1.5 rounded-lg border-2 cursor-pointer text-[11px] ${
                  on ? 'border-amber bg-amber/10 text-amber' : 'border-transparent bg-transparent text-ink hover:border-line-2'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {st.icon}
                </span>
                {st.label}
                {badge > 0 && (
                  <span className="absolute top-0.5 right-1 min-w-4 h-4 px-1 rounded-full bg-bad text-[#1a0606] text-[10px] grid place-items-center">{badge > 99 ? '99+' : badge}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Drawer({ s, d, id, onClose }: { s: GameState; d: Dispatch; id: string; onClose: () => void }) {
  const st = STATIONS.find((x) => x.id === id);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!st) return null;
  return (
    <aside
      aria-label={st.label}
      className="drawer absolute z-30 bg-void/95 backdrop-blur-sm border-line flex flex-col
        inset-x-0 bottom-0 max-h-[62%] border-t-2 rounded-t-2xl
        md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-[440px] md:border-t-0 md:border-l-2 md:rounded-none"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-line">
        <span aria-hidden>{st.icon}</span>
        <h2 className="m-0 font-pixel text-base font-normal text-amber flex-1">{st.label}</h2>
        <button type="button" onClick={onClose} className="min-w-10 min-h-10 bg-transparent border-2 border-line-2 text-ink cursor-pointer hover:border-amber" aria-label="Cerrar">
          ✕
        </button>
      </div>
      <div className="overflow-y-auto p-3 flex flex-wrap gap-3 content-start">{st.render(s, d)}</div>
    </aside>
  );
}

const TOAST_COLORS: Record<string, string> = { success: 'border-teal', fail: 'border-bad', press: 'border-pink', board: 'border-amber', info: 'border-line-2' };

/** Las últimas entradas del registro aparecen unos segundos y se van. */
function Toasts({ s }: { s: GameState }) {
  const [shown, setShown] = useState<{ id: number; text: string; type: string; at: number }[]>([]);
  const last = useRef<number>(s.log[0]?.id ?? -1);
  const latest = s.log[0]?.id ?? -1;
  useEffect(() => {
    if (latest <= last.current) {
      last.current = latest;
      return;
    }
    const fresh = s.log.filter((e) => e.id > last.current).slice(0, 3);
    last.current = latest;
    const now = Date.now();
    setShown((prev) => [...fresh.map((e) => ({ id: e.id, text: e.text, type: e.type, at: now })), ...prev].slice(0, 3));
  }, [latest, s.log]);
  useEffect(() => {
    if (shown.length === 0) return;
    const t = setInterval(() => setShown((prev) => prev.filter((x) => Date.now() - x.at < 6000)), 500);
    return () => clearInterval(t);
  }, [shown.length]);
  return (
    <ol aria-live="polite" className="absolute z-20 left-3 right-3 top-12 md:left-auto md:right-3 md:w-[360px] m-0 p-0 list-none flex flex-col gap-2 pointer-events-none">
      {shown.map((e) => (
        <li key={e.id} className={`fade-in bg-panel/95 border-l-4 ${TOAST_COLORS[e.type] ?? 'border-line-2'} px-3 py-2 text-[13px] shadow-lg`}>
          {e.text}
        </li>
      ))}
    </ol>
  );
}

export function App() {
  const s = useGame((x) => x.game);
  const d = useGame((x) => x.dispatch);
  const newGame = useGame((x) => x.newGame);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => startLoop(), []);

  // Si la estación deja de existir (cambio de fase), se cierra.
  const visible = visibleStations(s).some((x) => x.id === selected);
  const open = selected && visible ? selected : null;
  const select = (id: string) => setSelected(id || null);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <TopBar s={s} />
      {s.ending ? (
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-[900px] mx-auto">
            <EndingScreen s={s} onNewGame={newGame} />
          </div>
        </div>
      ) : (
        <>
          <main className="relative flex-1 min-h-0" aria-label="Escena">
            <World s={s} selected={open} onSelect={select} />
            <div className="absolute top-2.5 left-3 z-10 font-pixel text-[13px] text-ink bg-void/80 px-2 py-1 pointer-events-none">{caption(s)}</div>
            <Toasts s={s} />
            {open && <Drawer s={s} d={d} id={open} onClose={() => setSelected(null)} />}
          </main>
          <Dock s={s} selected={open} onSelect={select} />
        </>
      )}
      <Modals s={s} d={d} extra={<BoardModal s={s} d={d} />} />
    </div>
  );
}
