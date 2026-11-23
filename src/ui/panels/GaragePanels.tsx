// Fase 1 · Garaje: computación, datos, producto e investigación.
import { B } from '../../engine/balance';
import { UPGRADE_LABEL } from '../../engine/actions';
import { fmt, money, pct, sci } from '../../engine/format';
import {
  activeCapability,
  benchmarkShown,
  consumerGpuCost,
  dataQuality,
  ideasPerSecond,
  researcherCost,
  scrapeRate,
  totalFlops,
  totalTokens,
  wrapperUserCapacity,
  wrapperUsersTarget,
} from '../../engine/formulas';
import type { GameState, NicheId } from '../../engine/state';
import { NICHES, TIPS } from '../../content/text';
import { Bar, Btn, Panel, Row, Slider, Small, SplitBar, Toggle, Warn } from '../kit';
import type { Dispatch } from '../types';

export function AllocControl({ s, d }: { s: GameState; d: Dispatch }) {
  return (
    <>
      <Slider
        label="Reparto entrenamiento / inferencia"
        value={s.gpuAlloc}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => d({ type: 'setGpuAlloc', value: v })}
        display=""
      />
      <SplitBar
        parts={[
          { value: s.gpuAlloc, color: '#F5A623' },
          { value: 1 - s.gpuAlloc, color: '#5fd3bc' },
        ]}
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{pct(s.gpuAlloc)} entrenar</span>
        <span>{pct(1 - s.gpuAlloc)} servir</span>
      </div>
    </>
  );
}

export function ComputePanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cost = consumerGpuCost(s);
  return (
    <Panel title="Computación" collapsible={s.phase > 1} id="compute">
      <Row label="GPUs de consumo" value={s.gpus.consumer} />
      <Row label="GPUs alquiladas" value={s.gpus.rented} />
      <Row label="Potencia" value={`${sci(totalFlops(s))} FLOP/s`} />
      {s.t < s.timed.gpuShortageUntil && <Warn label="Escasez de GPUs" value="×1,5" />}
      <AllocControl s={s} d={d} />
      <Btn onClick={() => d({ type: 'buyConsumerGpu' })} disabled={s.money < cost} tip={TIPS.consumerGpu}>
        Comprar GPU de 2ª mano · {money(cost)}
      </Btn>
      <div className="flex gap-2">
        <Btn onClick={() => d({ type: 'rentGpus', delta: 1 })} tip={TIPS.rent} className="flex-1">
          Alquilar en la nube · {B.GPU.rented.rentPerSecond} €/s
        </Btn>
        <Btn onClick={() => d({ type: 'rentGpus', delta: -1 })} disabled={s.gpus.rented === 0}>
          −1
        </Btn>
      </div>
    </Panel>
  );
}

export function DataPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const t = totalTokens(s) || 1;
  const p = s.data;
  const licensedCost = s.phase >= 2 ? B.LICENSE_DEAL_P2.cost : B.LICENSED_COST;
  return (
    <Panel title="Datos" id="data">
      <Row label="Tokens disponibles" value={fmt(totalTokens(s))} />
      <SplitBar
        parts={[
          { value: p.clean, color: '#5fd3bc' },
          { value: p.scraped, color: '#b98cf0' },
          { value: p.licensed, color: '#F5A623' },
          { value: p.synthetic, color: '#ff6fa8' },
        ]}
      />
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span>{pct(p.clean / t)} limpios</span>
        <span>{pct(p.scraped / t)} scraping</span>
        <span>{pct(p.licensed / t)} licencia</span>
        {p.synthetic > 0 && <span>{pct(p.synthetic / t)} sintéticos</span>}
      </div>
      <Row label="Calidad media" value={fmt(dataQuality(s))} />
      <Warn label="Riesgo de demanda" value={`${fmt(s.lawsuitRisk, { decimals: 1 })} %`} />
      <Toggle checked={s.scraping} onChange={(on) => d({ type: 'setScraping', on })}>
        Scraping activado · +{fmt(scrapeRate(s))} tokens/s
      </Toggle>
      {s.upgrades.synthetic && (
        <Toggle checked={s.syntheticOn} onChange={(on) => d({ type: 'setSynthetic', on })}>
          Datos sintéticos · +{fmt(B.SYNTHETIC_RATE)} tokens/s (cuidado con el 40 %)
        </Toggle>
      )}
      <Btn onClick={() => d({ type: 'buyLicensed' })} disabled={s.money < licensedCost} tip={TIPS.licensed}>
        Comprar dataset con licencia · {money(licensedCost)}
      </Btn>
    </Panel>
  );
}

export function ProductPanel({ s, d }: { s: GameState; d: Dispatch }) {
  if (!s.niche) {
    return (
      <Panel title="Producto" id="product">
        <Small>Elige un nicho para tu wrapper. Es para siempre (o hasta que pivotes).</Small>
        {(Object.keys(NICHES) as NicheId[]).map((k) => (
          <Btn key={k} onClick={() => d({ type: 'chooseNiche', niche: k })} tip={NICHES[k].blurb}>
            {NICHES[k].label}
          </Btn>
        ))}
      </Panel>
    );
  }
  const target = wrapperUsersTarget(s);
  const capUsers = wrapperUserCapacity(s);
  return (
    <Panel title="Producto" collapsible={s.phase > 1} id="product">
      <div className="font-medium">{NICHES[s.niche].label}</div>
      {s.phase === 1 && (
        <>
          <div className="flex justify-between text-xs text-muted">
            <span>Usuarios para la Serie A</span>
            <span>
              {fmt(s.users, { decimals: 0 })} / {fmt(B.SERIES_A_USERS)}
            </span>
          </div>
          <Bar value={s.users / B.SERIES_A_USERS} color="#F5A623" />
        </>
      )}
      {s.phase > 1 && <Row label="Usuarios" value={fmt(s.users, { decimals: 0 })} />}
      <Row label="Objetivo de usuarios" value={fmt(target, { decimals: 0 })} />
      {s.phase === 1 && s.activeModelId && <Row label="Pueden servirse" value={fmt(capUsers, { decimals: 0 })} tone={capUsers < target + 1 ? 'warn' : undefined} />}
      <Row label="Ingresos" value={`+${fmt(s.users * B.WRAPPER_REVENUE_PER_USER)} €/s`} tone="good" />
      <Row label="Coste de inferencia" value={`−${fmt(s.users * B.WRAPPER_COST_PER_USER)} €/s`} tone="bad" />
      <Row label="Benchmark propio" value={s.activeModelId ? fmt(benchmarkShown(s), { decimals: 0 }) : '—'} tone={s.benchContaminated ? 'warn' : undefined} />
      {!s.activeModelId && <Small tone="warn">Sin modelo no hay producto. Entrena un fine-tune.</Small>}
      {s.benchContaminated && <Small>Real: {fmt(activeCapability(s), { decimals: 0 })}. Shhh.</Small>}
      <Toggle checked={s.benchContaminated} onChange={(on) => d({ type: 'setContaminate', on })}>
        Contaminar benchmark (+10, nadie se dará cuenta)
      </Toggle>
    </Panel>
  );
}

const PHASE1_UPGRADES = ['checkpoints', 'monitoring'];

export function ResearchPanel({ s, d, upgrades = PHASE1_UPGRADES, children }: { s: GameState; d: Dispatch; upgrades?: string[]; children?: React.ReactNode }) {
  const cost = researcherCost(s);
  return (
    <Panel title="Investigación" aside={`${fmt(ideasPerSecond(s))} ideas/s`} id="research">
      <Row label="Investigadores" value={s.researchers} />
      {s.seniorResearchers > 0 && <Row label="Sénior" value={s.seniorResearchers} />}
      <Row label="Ideas" value={fmt(Math.floor(s.ideas))} tone="accent" />
      <Btn onClick={() => d({ type: 'hireResearcher' })} disabled={s.money < cost} tip={TIPS.researcher}>
        Contratar investigador · {money(cost)}
      </Btn>
      {children}
      <div className="text-xs text-muted">Mejoras</div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {upgrades
          .filter((id) => B.UPGRADES[id].phase <= Math.max(1, s.phase))
          .map((id) =>
            s.upgrades[id] ? (
              <span key={id} className="border border-teal text-teal px-2 py-0.5">
                {UPGRADE_LABEL[id]} ✓
              </span>
            ) : (
              <button
                key={id}
                className="border border-line-2 text-ink px-2 py-0.5 min-h-8 bg-transparent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-amber font-mono text-xs"
                disabled={s.ideas < B.UPGRADES[id].cost}
                onClick={() => d({ type: 'buyUpgrade', id })}
              >
                {UPGRADE_LABEL[id]} · {B.UPGRADES[id].cost} ideas
              </button>
            ),
          )}
      </div>
    </Panel>
  );
}
