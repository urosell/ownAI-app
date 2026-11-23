import { useState } from 'react';
import { clock, fmt, money } from '../engine/format';
import type { GameState, ModifierId } from '../engine/state';
import { ENDINGS, MODIFIERS } from '../content/endings';
import { Btn, Row, Toggle } from './kit';

export function EndingScreen({ s, onNewGame }: { s: GameState; onNewGame: (mods: ModifierId[]) => void }) {
  const [mods, setMods] = useState<ModifierId[]>([]);
  if (!s.ending) return null;
  const e = ENDINGS[s.ending];
  const papersNow = s.log.find((l) => l.text.startsWith('Final:'))?.text.match(/\+(\d+) papers/)?.[1];
  return (
    <section className="fade-in bg-panel border-2 border-amber p-5 sm:p-8 flex flex-col gap-4 max-w-3xl mx-auto w-full" aria-label="Final de la partida">
      <h2 className="m-0 font-pixel text-3xl font-normal text-amber">{e.title}</h2>
      {e.text.map((p, i) => (
        <p key={i} className="m-0 leading-relaxed">
          {p}
        </p>
      ))}
      <div className="flex flex-col gap-1 border-t border-line pt-3">
        <Row label="Tiempo de juego" value={clock(s.t)} />
        <Row label="Capacidad máxima" value={fmt(s.maxCapability, { decimals: 0 })} />
        <Row label="Valoración máxima" value={money(s.stats.peakValuation)} />
        <Row label="Dilución" value={`${fmt(s.dilution, { decimals: 0 })} %`} />
        <Row label="Entrenamientos / fallidos" value={`${s.runsStarted} / ${s.stats.failures}`} />
        <Row label="Lanzamientos · incidentes · demandas" value={`${s.stats.launches} · ${s.stats.incidents} · ${s.stats.lawsuits}`} />
        <Row label="Papers de prestigio" value={`${s.prestige.papers}${papersNow ? ` (+${papersNow})` : ' (final ya visto)'}`} tone="accent" />
        <Row label="Finales vistos" value={`${s.prestige.endingsSeen.length} / ${Object.keys(ENDINGS).length}`} />
      </div>
      <p className="m-0 text-xs text-muted">
        Cada paper da +1 % de probabilidad de éxito al entrenar (máx. +10 %) y abarata un 2 % a los investigadores.
      </p>
      {s.prestige.unlockedModifiers.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted">Modificadores para la próxima partida</div>
          {s.prestige.unlockedModifiers.map((m) => (
            <Toggle key={m} checked={mods.includes(m)} onChange={(on) => setMods(on ? [...mods, m] : mods.filter((x) => x !== m))}>
              <span>
                {MODIFIERS[m].label} <span className="text-muted">· {MODIFIERS[m].text}</span>
              </span>
            </Toggle>
          ))}
        </div>
      )}
      <Btn primary onClick={() => onNewGame(mods)}>
        Empezar otra vez en el garaje
      </Btn>
    </section>
  );
}
