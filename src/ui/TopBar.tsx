import { money, perSecond, fmt } from '../engine/format';
import { arr } from '../engine/formulas';
import type { GameState } from '../engine/state';
import { PHASE_NAMES } from '../content/text';

function Stat({ label, children, tone }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-lg sm:text-xl font-medium tabular-nums ${tone ?? ''}`}>{children}</span>
    </div>
  );
}

export function TopBar({ s }: { s: GameState }) {
  const net = s.revenuePerSecond - s.costPerSecond;
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-panel border-2 border-line px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <div className="font-pixel text-[28px] leading-none text-amber">OwnAI</div>
        <div className="text-xs text-muted hidden sm:block">Build your own AI empire and get rich with hype</div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <Stat label="Dinero" tone={s.money < 0 ? 'text-bad' : undefined}>
          {money(s.money)}
        </Stat>
        <Stat label="Ingresos" tone={net >= 0 ? 'text-teal' : 'text-bad'}>
          {perSecond(net)}
        </Stat>
        {s.phase >= 2 && <Stat label="ARR">{money(arr(s))}</Stat>}
        {s.phase >= 2 && <Stat label="Valoración">{money(s.valuation)}</Stat>}
        {(s.phase >= 1 || s.hype > 0) && <Stat label="Hype">{fmt(s.hype, { decimals: 0 })}</Stat>}
        <div className="flex flex-col">
          <span className="text-xs text-muted">Fase</span>
          <span className="font-pixel text-lg text-amber">
            {s.phase} · {PHASE_NAMES[s.phase]}
          </span>
        </div>
      </div>
    </header>
  );
}
