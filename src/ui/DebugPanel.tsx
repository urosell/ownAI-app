import { useState } from 'react';
import { EVENT_IDS } from '../engine/events';
import { exportSave, importSave } from '../engine/save';
import type { EndingId, GameState, Phase } from '../engine/state';
import { ENDINGS } from '../content/endings';
import { Btn, Panel } from './kit';
import { useGame } from './store';
import type { Dispatch } from './types';

export const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';

export function DebugPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const speed = useGame((x) => x.speed);
  const setSpeed = useGame((x) => x.setSpeed);
  const [ev, setEv] = useState<string>(EVENT_IDS[0]);
  const [end, setEnd] = useState<EndingId>('agi');
  return (
    <Panel title="Debug" aside={`t = ${s.t.toFixed(1)} s · semilla ${s.rngSeed}`} basis={300} collapsible>
      <div className="flex flex-wrap gap-2">
        {[1, 10, 100].map((n) => (
          <Btn key={n} small onClick={() => setSpeed(n)} className={speed === n ? 'outline outline-2 outline-amber' : ''}>
            ×{n}
          </Btn>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn small onClick={() => d({ type: 'debugMoney', amount: Math.max(1000, Math.abs(s.money)) })}>
          +dinero
        </Btn>
        <Btn small onClick={() => d({ type: 'debugGpus', amount: s.phase >= 2 ? 1000 : 4 })}>
          +GPUs
        </Btn>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted">Saltar a fase</span>
        {([1, 2, 3] as Phase[]).map((p) => (
          <Btn key={p} small onClick={() => d({ type: 'debugPhase', phase: p })} disabled={s.phase >= p}>
            {p}
          </Btn>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={ev} onChange={(e) => setEv(e.target.value)} className="bg-void text-ink border border-line-2 min-h-9 px-2 font-mono text-[13px]">
          {EVENT_IDS.map((id) => (
            <option key={id}>{id}</option>
          ))}
        </select>
        <Btn small onClick={() => d({ type: 'debugEvent', id: ev })}>
          Forzar evento
        </Btn>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select value={end} onChange={(e) => setEnd(e.target.value as EndingId)} className="bg-void text-ink border border-line-2 min-h-9 px-2 font-mono text-[13px]">
          {(Object.keys(ENDINGS) as EndingId[]).map((id) => (
            <option key={id}>{id}</option>
          ))}
        </select>
        <Btn small onClick={() => d({ type: 'debugEnding', id: end })}>
          Forzar final
        </Btn>
      </div>
    </Panel>
  );
}

export function SaveBar({ s }: { s: GameState }) {
  const replace = useGame((x) => x.replace);
  const newGame = useGame((x) => x.newGame);
  const save = useGame((x) => x.save);
  const [msg, setMsg] = useState('');
  return (
    <footer className="flex flex-wrap gap-2 items-center text-xs text-muted">
      <span>Autoguardado cada 10 s.</span>
      <Btn
        small
        onClick={async () => {
          const code = exportSave(s);
          try {
            await navigator.clipboard.writeText(code);
            setMsg('Partida copiada al portapapeles.');
          } catch {
            window.prompt('Copia este código:', code);
          }
        }}
      >
        Exportar
      </Btn>
      <Btn
        small
        onClick={() => {
          const code = window.prompt('Pega el código de la partida:');
          if (!code) return;
          try {
            replace(importSave(code));
            save();
            setMsg('Partida importada.');
          } catch {
            setMsg('Ese código no es una partida válida.');
          }
        }}
      >
        Importar
      </Btn>
      <Btn
        small
        onClick={() => {
          if (window.confirm('¿Empezar una partida nueva? Se pierde la actual (los papers se conservan).')) newGame();
        }}
      >
        Nueva partida
      </Btn>
      {msg && <span className="text-teal">{msg}</span>}
    </footer>
  );
}
