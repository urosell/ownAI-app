import { clock } from '../engine/format';
import type { GameState, LogType } from '../engine/state';

const COLORS: Record<LogType, string> = {
  info: '',
  success: 'text-teal',
  fail: 'text-bad',
  press: 'text-pink',
  board: 'text-amber-hi',
};

const LABEL: Record<LogType, string> = {
  info: 'info',
  success: 'éxito',
  fail: 'fallo',
  press: 'prensa',
  board: 'junta',
};

export function LogPanel({ s }: { s: GameState }) {
  return (
    <section className="bg-panel border-2 border-line p-4 flex flex-col gap-2.5 min-w-0" aria-label="Registro">
      <h2 className="m-0 font-pixel text-base font-normal text-amber">Registro</h2>
      <ol className="list-none m-0 p-0 flex flex-col gap-2 text-[13px] max-h-[70vh] overflow-y-auto" aria-live="polite">
        {s.log.length === 0 && <li className="text-muted">Un garaje. Un portátil. Ninguna IA. Todavía.</li>}
        {s.log.map((e) => (
          <li key={e.id}>
            <span className="text-muted">[{e.phase >= 2 ? `T${e.quarter}` : clock(e.t)}] </span>
            <span className={COLORS[e.type]}>
              <span className="sr-only">{LABEL[e.type]}: </span>
              {e.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
