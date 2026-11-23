// Fase 2 · Scale-up
import { useState } from 'react';
import { B } from '../../engine/balance';
import { boardTargets, myBoardCapability } from '../../engine/board';
import { clock, fmt, money, pct, sci } from '../../engine/format';
import {
  activeCapability,
  activeModel,
  arr,
  computeC,
  currentE,
  datacenterGpuBatchCost,
  gpuSlots,
  inferenceEfficiency,
  leaderboard,
  maxPretrainTokens,
  modelCapability,
  ownedGpus,
  roundAmount,
  scalingEfficiency,
  seniorCost,
  serviceCapacity,
  totalFlops,
  trainingDuration,
  trainingFlopsPerSecond,
} from '../../engine/formulas';
import { planPretrain } from '../../engine/phases/training';
import { canRaise, launchBlockedReason, nextPromiseText, poachProbability, sftCost, sftDuration } from '../../engine/phases/scaleup';
import type { GameState } from '../../engine/state';
import { BOARD_OPTIONS, TIPS } from '../../content/text';
import { ModalFrame } from '../Modal';
import { Bar, Btn, Panel, Row, Slider, Small, Warn } from '../kit';
import { AllocControl } from './GaragePanels';
import { PBreakdown, RunView } from './TrainingPanel';
import type { Dispatch } from '../types';

export function PretrainPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const [logN, setLogN] = useState(9.8);
  const [logD, setLogD] = useState(11.1);
  const [ablation, setAblation] = useState(0);
  const run = s.currentRun;
  const maxN = s.phase >= 3 ? B.PRETRAIN_LOG_N_MAX_P3 : B.PRETRAIN_LOG_N_MAX;
  const maxD = s.phase >= 3 ? B.PRETRAIN_LOG_D_MAX_P3 : B.PRETRAIN_LOG_D_MAX;
  const N = 10 ** logN;
  const D = 10 ** logD;
  const plan = planPretrain(s, { N, D, ablation });
  const eff = scalingEfficiency(N, D, currentE(s));
  const dur = trainingDuration(s, plan.C * (1 + ablation));
  const hasTeam = s.researchers + s.seniorResearchers > 0;
  const maxLoss = s.upgrades.checkpoints ? plan.cost * B.RESUME_COST_MAX : plan.cost;
  const n = s.models.filter((m) => m.kind === 'pretrain').length + 1;
  return (
    <Panel title="Preentrenamiento" aside={run ? `Modelo ${run.modelName}` : `Modelo OwnAI-${n} · desde cero`} grow={2} basis={520} id="training">
      {run ? (
        <RunView s={s} run={run} d={d} />
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2.5" style={{ flex: '3 1 280px', minWidth: 0 }}>
              <Slider label="Parámetros (N)" value={logN} min={B.PRETRAIN_LOG_N_MIN} max={maxN} step={0.1} onChange={setLogN} display={fmt(N)} />
              <Slider label="Tokens (D)" value={logD} min={B.PRETRAIN_LOG_D_MIN} max={maxD} step={0.1} onChange={setLogD} display={`${fmt(D)} · máx. ${fmt(maxPretrainTokens(s))}`} />
              <div className="flex flex-col gap-0.5">
                <Row label="Computación C = 6·N·D" value={`${sci(computeC(N, D))} FLOPs`} />
                <Row
                  label="Eficiencia de escalado"
                  value={`${pct(eff)} · ${eff > 0.9 ? 'casi óptimo' : D / N < 20 ? 'faltan datos' : 'sobran datos'}`}
                  tone={eff > 0.9 ? 'good' : 'warn'}
                />
                <Row label="Capacidad esperada" value={fmt(plan.capability, { decimals: 0 })} />
                <Row label="Duración · coste" value={`${Number.isFinite(dur) ? `${Math.ceil(dur)} s` : '—'} · ${money(plan.cost)}`} />
              </div>
              <Btn small onClick={() => setLogD(Math.min(maxD, logN + Math.log10(B.CHINCHILLA_TOKENS_PER_PARAM)))} tip={TIPS.pretrain}>
                Ajustar D ≈ 20·N
              </Btn>
            </div>
            <div className="flex flex-col gap-1.5" style={{ flex: '2 1 200px' }}>
              <PBreakdown plan={plan} />
              <Small>
                Si falla pierdes hasta {money(maxLoss)}
                {s.upgrades.checkpoints ? ' (con checkpoints)' : ''}
              </Small>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn primary onClick={() => d({ type: 'startPretrain', params: { N, D, ablation } })} disabled={!plan.ok} tip={plan.reason ?? TIPS.pretrain}>
              Lanzar preentrenamiento
            </Btn>
            {hasTeam &&
              B.ABLATION_OPTIONS.map((a, i) => (
                <Btn key={a} small onClick={() => setAblation(a)} className={ablation === a ? 'outline outline-2 outline-amber' : ''} tip={TIPS.ablation}>
                  Ablaciones {Math.round(a * 100)} % · +{Math.round(B.ABLATION_BONUS[i] * 100)} %
                </Btn>
              ))}
          </div>
          {plan.reason && <Small tone="warn">{plan.reason}</Small>}
        </>
      )}
    </Panel>
  );
}

export function ModelsPanel({ s, d, evalButton }: { s: GameState; d: Dispatch; evalButton?: (id: string) => React.ReactNode }) {
  const models = [...s.models].reverse().slice(0, 5);
  const flops = trainingFlopsPerSecond(s);
  return (
    <Panel title="Modelos" aside="post-entrenamiento y lanzamientos" basis={360} id="models">
      {models.length === 0 && <Small>Aún no tienes modelos propios.</Small>}
      {s.postRun && (
        <div className="flex flex-col gap-1">
          <Small>
            {s.postRun.kind === 'sft' ? 'SFT' : 'Evaluación'} de {s.models.find((m) => m.id === s.postRun!.modelId)?.name}: quedan {Math.ceil(s.postRun.remaining)} s
          </Small>
          <Bar value={1 - s.postRun.remaining / s.postRun.total} color="#b98cf0" height={6} />
        </div>
      )}
      {models.map((m) => {
        const cap = modelCapability(s, m);
        const block = launchBlockedReason(s, m);
        const active = m.id === s.activeModelId;
        return (
          <div key={m.id} className="border border-line p-2 flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium">
                {m.name} {active && <span className="text-amber">· en producción</span>}
              </span>
              <span>cap. {fmt(cap, { decimals: 0 })}</span>
            </div>
            <Small>
              {m.kind === 'pretrain' ? `${fmt(m.N)} parámetros · ${fmt(m.D)} tokens` : 'fine-tune'}
              {m.sft ? ' · SFT ✓' : m.kind === 'pretrain' ? ' · sin SFT' : ''}
              {m.evaluated ? ' · evaluado ✓' : ''}
            </Small>
            {m.kind === 'pretrain' && !m.sft && (
              <Btn small onClick={() => d({ type: 'startSft', id: m.id })} disabled={!!s.postRun || s.money < sftCost(m) || flops <= 0} tip={TIPS.sft}>
                SFT · {money(sftCost(m))} · {Number.isFinite(sftDuration(m, flops)) ? `${Math.ceil(sftDuration(m, flops))} s` : '—'}
              </Btn>
            )}
            {m.kind === 'pretrain' && m.rlhf !== null && (
              <Slider
                label="Amabilidad (RLHF)"
                value={m.rlhf}
                min={0}
                max={100}
                step={1}
                onChange={(v) => d({ type: 'setRlhf', id: m.id, value: v })}
                display={`${m.rlhf}${m.rlhf < B.RLHF_LOW ? ' · maleducado' : m.rlhf > B.RLHF_HIGH ? ' · se niega a todo' : m.rlhf >= 60 && m.rlhf <= 75 ? ' · óptimo' : ''}`}
              />
            )}
            {evalButton?.(m.id)}
            {!active && (
              <Btn small primary={!block} onClick={() => d({ type: 'launchModel', id: m.id })} disabled={!!block} tip={block ?? TIPS.launch}>
                {m.released ? 'Volver a poner en producción' : 'Lanzar'}
              </Btn>
            )}
          </div>
        );
      })}
    </Panel>
  );
}

export function HypePanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cap = myBoardCapability(s);
  const debt = Math.max(0, s.expectation - cap);
  const promiseIn = Math.max(0, s.timed.promiseReadyAt - s.t);
  const roundBlock = canRaise(s);
  return (
    <Panel title="Hype y expectativas" id="hype">
      <Row label="Hype" value={fmt(s.hype, { decimals: 0 })} />
      <Bar value={s.hype / 100} color="#ff6fa8" />
      <Row label="Capacidad real" value={fmt(cap, { decimals: 0 })} />
      <Bar value={cap / 100} color="#5fd3bc" />
      <Row label="Expectativa" value={fmt(s.expectation, { decimals: 0 })} />
      <Bar value={s.expectation / 100} color="#F5A623" />
      <Warn label="Deuda de expectativas" value={fmt(debt, { decimals: 0 })} />
      <Btn onClick={() => d({ type: 'promise' })} disabled={promiseIn > 0} tip={TIPS.promise}>
        {promiseIn > 0 ? `Prometer otra vez en ${Math.ceil(promiseIn)} s` : `Prometer “${nextPromiseText(s)}”`}
      </Btn>
      <Row label="Dilución" value={`${fmt(s.dilution, { decimals: 0 })} %`} />
      <Btn onClick={() => d({ type: 'raiseRound' })} disabled={!!roundBlock} tip={roundBlock ?? TIPS.round}>
        Levantar ronda · {money(roundAmount(s))} por {fmt(B.ROUND_DILUTION * (1 - s.dilution / 100), { decimals: 0 })} %
      </Btn>
    </Panel>
  );
}

export function DatacenterComputePanel({ s, d }: { s: GameState; d: Dispatch }) {
  const free = gpuSlots(s) - ownedGpus(s);
  return (
    <Panel title="Computación" id="compute">
      <Row label="GPUs de datacenter" value={fmt(s.gpus.datacenter)} />
      {s.gpus.consumer > 0 && <Row label="GPUs de consumo" value={s.gpus.consumer} />}
      <Row label="GPUs alquiladas" value={fmt(s.gpus.rented)} />
      {Number.isFinite(free) && <Row label="Huecos libres" value={fmt(free)} tone={free <= 0 ? 'bad' : undefined} />}
      <Row label="Potencia" value={`${sci(totalFlops(s))} FLOP/s`} />
      {s.t < s.timed.gpuShortageUntil && <Warn label="Escasez de GPUs" value="×1,5" />}
      <AllocControl s={s} d={d} />
      <div className="text-xs text-muted">Comprar GPUs de datacenter</div>
      <div className="flex flex-wrap gap-2">
        {[1, 10, 100, 1000].map((n) => {
          const c = datacenterGpuBatchCost(s, n);
          return (
            <Btn key={n} small onClick={() => d({ type: 'buyDatacenterGpus', n })} disabled={s.money < c || free < n} tip={TIPS.datacenterGpu}>
              ×{n} · {money(c)}
            </Btn>
          );
        })}
      </div>
      <div className="text-xs text-muted">Alquilar en la nube ({B.GPU.rented.rentPerSecond} €/s cada una)</div>
      <div className="flex flex-wrap gap-2">
        {[10, 100, 1000].map((n) => (
          <Btn key={n} small onClick={() => d({ type: 'rentGpus', delta: n })} tip={TIPS.rent}>
            +{n}
          </Btn>
        ))}
        {[10, 100, 1000].map((n) => (
          <Btn key={-n} small onClick={() => d({ type: 'rentGpus', delta: -n })} disabled={s.gpus.rented < n}>
            −{n}
          </Btn>
        ))}
      </div>
    </Panel>
  );
}

export function ApiPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const capacity = serviceCapacity(s);
  const margin = s.revenuePerSecond - s.costPerSecond;
  const m = activeModel(s);
  return (
    <Panel title="API" id="api">
      <Slider
        label="Tu precio"
        value={Math.log10(s.apiPrice)}
        min={-1}
        max={2}
        step={0.01}
        onChange={(v) => d({ type: 'setApiPrice', value: Math.round(10 ** v * 100) / 100 })}
        display={`${fmt(s.apiPrice)} € / M tokens`}
      />
      <Row label="Precio de mercado" value={`${fmt(s.marketPrice)} € / M tokens`} />
      <Row
        label="Demanda / capacidad"
        value={`${fmt(s.demandTps)} / ${fmt(capacity)} tok/s`}
        tone={s.demandTps > capacity * B.LATENCY_OVERLOAD ? 'warn' : undefined}
      />
      <Row label="Margen" value={`${margin >= 0 ? '+' : ''}${fmt(margin)} €/s`} tone={margin >= 0 ? 'good' : 'bad'} />
      <Row label="Modelo servido" value={m ? `${m.name} · cap. ${fmt(activeCapability(s), { decimals: 0 })}` : '—'} />
      <div className="text-xs text-muted">Optimizaciones (eficiencia ×{fmt(inferenceEfficiency(s))})</div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {(['quantization', 'distillation', 'contextCache'] as const).map((id) => {
          const label = { quantization: 'Cuantización ×1,8', distillation: 'Destilación ×2', contextCache: 'Caché ×1,3' }[id];
          return s.upgrades[id] ? (
            <span key={id} className="border border-teal text-teal px-2 py-0.5">
              {label}
            </span>
          ) : (
            <button
              key={id}
              className="border border-line-2 text-muted px-2 py-0.5 min-h-8 bg-transparent font-mono text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-amber enabled:hover:text-ink"
              disabled={s.ideas < B.UPGRADES[id].cost}
              onClick={() => d({ type: 'buyUpgrade', id })}
            >
              {label} · {B.UPGRADES[id].cost} ideas
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export function BoardPanel({ s }: { s: GameState }) {
  const { arrTarget, capTarget } = boardTargets(s);
  const a = arr(s);
  const cap = myBoardCapability(s);
  const left = B.QUARTER_SECONDS - s.board.timer;
  const arrOk = a >= arrTarget;
  const capOk = cap >= capTarget;
  const lb = leaderboard(s);
  return (
    <Panel title="Junta" aside={`próxima en ${clock(left)}`} id="board">
      <Row label="ARR objetivo" value={`${money(a)} / ${money(arrTarget)}`} />
      <Bar value={a / arrTarget} color={arrOk ? '#5fd3bc' : '#ff8a8a'} />
      <Row label="Capacidad objetivo" value={`${fmt(cap, { decimals: 0 })} / ${fmt(capTarget, { decimals: 0 })}`} />
      <Bar value={capTarget > 0 ? cap / capTarget : 1} color={capOk ? '#5fd3bc' : '#ffc35c'} />
      <Small>
        {arrOk && capOk
          ? 'Vas camino de cumplir. La junta prepara un "buen trabajo, equipo" de compromiso.'
          : 'Vas camino de incumplir. La junta ya está redactando un correo con muchos “alineemos expectativas”.'}
      </Small>
      <div className="text-xs text-muted">Ranking</div>
      <ol className="list-none m-0 p-0 flex flex-col gap-0.5 text-[13px]">
        {lb.map((r, i) => (
          <li key={r.name} className={`flex justify-between ${r.you ? 'text-amber' : ''}`}>
            <span>
              {i + 1}. {r.name}
            </span>
            <span>{fmt(r.cap, { decimals: 0 })}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function TalentPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cost = seniorCost(s);
  return (
    <Panel title="Talento" id="talent">
      <Row label="Investigadores" value={`${s.researchers} + ${s.seniorResearchers} sénior`} />
      <Btn onClick={() => d({ type: 'hireSenior' })} disabled={s.money < cost} tip={TIPS.senior}>
        Fichar sénior · {money(cost)}
      </Btn>
      <Slider
        label="Equity repartida (del pool del 10 %)"
        value={s.equityPool}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => d({ type: 'setEquity', value: v })}
        display={pct(s.equityPool)}
      />
      <Warn label="P(fuga) este trimestre" value={pct(poachProbability(s))} />
      {s.board.salaryMult < 1 && <Small>Sueldos recortados al {pct(s.board.salaryMult)}.</Small>}
    </Panel>
  );
}

export function ContractsPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cap = activeCapability(s);
  if (s.contracts.length === 0) return null;
  return (
    <Panel title="Contratos enterprise" id="contracts">
      {s.contracts.map((c) => (
        <div key={c.id} className="border border-line p-2 flex flex-col gap-1 text-[13px]">
          <div>
            {c.client} {c.text}
          </div>
          <Row label="Pide" value={`cap. ≥ ${c.minCapability} · ${fmt(c.tokensPerSecond)} tok/s`} tone={cap < c.minCapability ? 'bad' : undefined} />
          <Row label="Paga" value={`+${fmt(c.revenuePerSecond)} €/s`} tone="good" />
          {c.accepted ? (
            <Small tone={c.breached > 0 ? 'bad' : 'muted'}>
              Activo · quedan {c.remaining} trimestres{c.breached > 0 ? ` · penalizaciones ${money(c.breached)}` : ''}
            </Small>
          ) : (
            <div className="flex gap-2">
              <Btn small primary onClick={() => d({ type: 'acceptContract', id: c.id })}>
                Firmar ({Math.ceil(c.remaining)} s)
              </Btn>
              <Btn small onClick={() => d({ type: 'rejectContract', id: c.id })}>
                Rechazar
              </Btn>
            </div>
          )}
        </div>
      ))}
      <Small>Incumplir el SLA cuesta 3 veces lo que dejas de servir.</Small>
    </Panel>
  );
}

export function ArchitectureButton({ s, d }: { s: GameState; d: Dispatch }) {
  if (s.archLevel >= B.ARCH_LEVELS) return <Small tone="good">Arquitectura al máximo (nivel {s.archLevel}).</Small>;
  const c = B.ARCH_BASE_COST * B.ARCH_GROWTH ** s.archLevel;
  return (
    <Btn onClick={() => d({ type: 'buyArchitecture' })} disabled={s.ideas < c} tip="Cada nivel baja la loss irreducible E un 3 %. Hace falta para pasar de ~95 de capacidad.">
      Nueva arquitectura (nivel {s.archLevel + 1}/{B.ARCH_LEVELS}) · {fmt(c)} ideas
    </Btn>
  );
}

export function BoardModal({ s, d }: { s: GameState; d: Dispatch }) {
  const m = s.modal;
  if (m?.kind !== 'board') return null;
  return (
    <ModalFrame title={`Junta trimestral · T${m.quarter}`}>
      <div className="flex flex-col gap-1">
        <Row label="ARR" value={`${money(m.arr)} / ${money(m.arrTarget)}`} tone={m.arr >= m.arrTarget ? 'good' : 'bad'} />
        <Row label="Capacidad" value={`${fmt(m.cap, { decimals: 0 })} / ${fmt(m.capTarget, { decimals: 0 })}`} tone={m.cap >= m.capTarget ? 'good' : 'bad'} />
      </div>
      <p className="m-0">{m.text}</p>
      {m.met ? (
        <Btn primary onClick={() => d({ type: 'boardChoice', choice: 'ok' })}>
          Gracias, junta
        </Btn>
      ) : (
        <div className="flex flex-col gap-2">
          {(Object.keys(BOARD_OPTIONS) as (keyof typeof BOARD_OPTIONS)[]).map((k) => (
            <Btn key={k} onClick={() => d({ type: 'boardChoice', choice: k as 'fake' })}>
              <span className="flex flex-col items-start text-left py-1.5">
                <span className="font-medium">{BOARD_OPTIONS[k].label}</span>
                <span className="text-xs text-muted">
                  {BOARD_OPTIONS[k].effect} · {BOARD_OPTIONS[k].cost}
                </span>
              </span>
            </Btn>
          ))}
          {s.board.missedStreak >= 1 && <Small tone="warn">Si incumples otra vez sin decir la verdad, despiden al CEO este fin de semana.</Small>}
        </div>
      )}
    </ModalFrame>
  );
}

