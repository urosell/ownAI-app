// El ordenador de la fundadora: un escritorio de mentira con "apps" que son las acciones del juego.
import { useState, type ReactNode } from 'react';
import { B } from '../../engine/balance';
import { money, fmt } from '../../engine/format';
import { annotatorCost, consumerGpuCost, rentLimit, researcherCost } from '../../engine/formulas';
import type { GameState } from '../../engine/state';
import { InboxPanel, InvestorsPanel } from '../panels/FakePanels';
import type { Dispatch } from '../types';

interface App {
  id: string;
  name: string;
  icon: string;
  show: (s: GameState) => boolean;
  badge?: (s: GameState) => number;
}

const APPS: App[] = [
  { id: 'prompts', name: 'Bandeja', icon: '💬', show: (s) => s.phase <= 1, badge: (s) => s.queue.length },
  { id: 'segundamano', name: 'Segundamano', icon: '🏷️', show: () => true },
  { id: 'linkedout', name: 'LinkedOut', icon: '👔', show: () => true },
  { id: 'nube', name: 'Nube', icon: '☁️', show: (s) => s.phase >= 1 },
  { id: 'banco', name: 'Banco', icon: '🏦', show: (s) => s.phase === 0 },
];

export function Desktop({ s, d }: { s: GameState; d: Dispatch }) {
  const [open, setOpen] = useState<string | null>(null);
  const apps = APPS.filter((a) => a.show(s));
  const app = apps.find((a) => a.id === open);

  return (
    <div className="w-full border-2 border-line bg-[#0e0c14] flex flex-col min-h-[360px]">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-panel border-b-2 border-line text-xs text-muted">
        <span className="flex gap-1" aria-hidden>
          <i className="block w-2.5 h-2.5 rounded-full bg-bad" />
          <i className="block w-2.5 h-2.5 rounded-full bg-amber" />
          <i className="block w-2.5 h-2.5 rounded-full bg-teal" />
        </span>
        {app ? (
          <button type="button" className="text-ink hover:text-amber cursor-pointer bg-transparent border-0 p-0 font-mono text-xs" onClick={() => setOpen(null)}>
            ← Escritorio
          </button>
        ) : (
          <span>portatil-de-la-fundadora</span>
        )}
        <span className="ml-auto">{app?.name ?? ''}</span>
      </div>

      {!app ? (
        <div className="grid grid-cols-3 gap-3 p-4 content-start" style={{ background: 'radial-gradient(circle at 30% 20%, #2b2340, #0e0c14 70%)' }}>
          {apps.map((a) => {
            const n = a.badge?.(s) ?? 0;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpen(a.id)}
                className="relative flex flex-col items-center gap-1 p-2 rounded-xl bg-transparent border-0 text-ink cursor-pointer hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-amber"
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {a.icon}
                </span>
                <span className="text-xs">{a.name}</span>
                {n > 0 && (
                  <span className="absolute top-0 right-2 min-w-5 h-5 px-1 rounded-full bg-bad text-[#1a0606] text-[11px] font-medium grid place-items-center">
                    {n > 99 ? '99+' : n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3 flex flex-wrap gap-3">{renderApp(app.id, s, d)}</div>
      )}
    </div>
  );
}

function renderApp(id: string, s: GameState, d: Dispatch): ReactNode {
  switch (id) {
    case 'prompts':
      return <InboxPanel s={s} d={d} />;
    case 'banco':
      return <InvestorsPanel s={s} d={d} />;
    case 'segundamano':
      return <Segundamano s={s} d={d} />;
    case 'linkedout':
      return <LinkedOut s={s} d={d} />;
    case 'nube':
      return <Nube s={s} d={d} />;
  }
  return null;
}

// ── Webs de mentira: fondo claro a propósito, son "otra web" dentro del juego ──

function Site({ brand, color, children }: { brand: string; color: string; children: ReactNode }) {
  return (
    <div className="w-full bg-[#f6f3ee] text-[#2a2530] rounded-md overflow-hidden">
      <div className="px-3 py-2 font-medium text-white" style={{ background: color }}>
        {brand}
      </div>
      <div className="p-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Listing({
  title,
  detail,
  price,
  action,
  disabled,
  sold,
  onClick,
}: {
  title: string;
  detail: string;
  price: string;
  action?: string;
  disabled?: boolean;
  sold?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className={`flex gap-3 items-center bg-white rounded-md p-2.5 shadow-sm ${sold ? 'opacity-50' : ''}`}>
      <div className="w-14 h-14 shrink-0 rounded-md bg-[#e4ded4] grid place-items-center text-2xl" aria-hidden>
        {sold ? '🚫' : '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium leading-tight">{title}</div>
        <div className="text-xs text-[#6b6475] leading-snug">{detail}</div>
        <div className="text-sm font-medium mt-0.5">{sold ? 'Vendido' : price}</div>
      </div>
      {action && !sold && (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="shrink-0 min-h-10 px-3 rounded-md bg-[#13a389] text-white text-[13px] border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Segundamano({ s, d }: { s: GameState; d: Dispatch }) {
  const first = s.phase === 0;
  const cost = first ? B.FIRST_GPU_COST : consumerGpuCost(s);
  return (
    <Site brand="segundamano · compra lo que otro ya rompió" color="#13a389">
      <Listing
        title={first ? 'Tarjeta gráfica de minero, "casi sin uso"' : `GPU de consumo (tienes ${s.gpus.consumer})`}
        detail={first ? 'Huele un poco a quemado. Entrega en mano en un parking.' : 'Cada vez quedan menos y el vendedor lo sabe: +12 % por unidad.'}
        price={money(cost)}
        action="Comprar"
        disabled={s.money < cost}
        onClick={() => d({ type: first ? 'buyFirstGpu' : 'buyConsumerGpu' })}
      />
      <Listing title="«IA» en una hoja de Excel" detail="Con macros. Responde siempre 42." price="300 €" sold />
      <Listing title="Silla gamer con un brazo" detail="El otro brazo se vende aparte." price="40 €" sold />
      {s.money < cost && <div className="text-xs text-[#b0413e]">Te faltan {money(cost - s.money)}.</div>}
    </Site>
  );
}

function LinkedOut({ s, d }: { s: GameState; d: Dispatch }) {
  const ann = annotatorCost(s);
  const res = researcherCost(s);
  return (
    <Site brand="LinkedOut · gente que busca trabajo, y otra que finge no buscarlo" color="#2f6fb0">
      <Listing
        title="Anotador/a de datos"
        detail={`Responde prompts haciéndose pasar por una IA. Sueldo ${fmt(B.ANNOTATOR_SALARY)} €/s. Tienes ${s.annotators}.`}
        price={money(ann)}
        action="Contratar"
        disabled={s.money < ann}
        onClick={() => d({ type: 'hireAnnotator' })}
      />
      {s.phase >= 1 && (
        <Listing
          title="Investigador/a de ML"
          detail={`Genera ideas y sube la P(éxito). Sueldo ${fmt(B.RESEARCHER_SALARY)} €/s. Tienes ${s.researchers}.`}
          price={money(res)}
          action="Contratar"
          disabled={s.money < res}
          onClick={() => d({ type: 'hireResearcher' })}
        />
      )}
      <div className="text-xs text-[#6b6475]">«Emocionado de anunciar que empiezo una nueva etapa…» — 3 personas que acabas de contratar.</div>
    </Site>
  );
}

function Nube({ s, d }: { s: GameState; d: Dispatch }) {
  const limit = rentLimit(s);
  return (
    <Site brand="Nube · GPUs de otro, factura tuya" color="#6a4fc0">
      <div className="text-[13px]">
        Alquiladas: <b>{s.gpus.rented}</b> de {limit} · {B.GPU.rented.rentPerSecond} €/s cada una, 4× una de consumo.
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 min-h-11 rounded-md bg-[#6a4fc0] text-white border-0 cursor-pointer disabled:opacity-40"
          disabled={s.gpus.rented >= limit}
          onClick={() => d({ type: 'rentGpus', delta: 1 })}
        >
          Alquilar 1
        </button>
        <button
          type="button"
          className="flex-1 min-h-11 rounded-md bg-white text-[#2a2530] border border-[#cfc8da] cursor-pointer disabled:opacity-40"
          disabled={s.gpus.rented === 0}
          onClick={() => d({ type: 'rentGpus', delta: -1 })}
        >
          Devolver 1
        </button>
      </div>
      <div className="text-xs text-[#6b6475]">Puedes devolverlas cuando quieras. Sin permanencia, sin cariño.</div>
    </Site>
  );
}
