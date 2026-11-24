import { useState } from 'react';
import { B } from '../../engine/balance';
import { fmt, money, pct, sci } from '../../engine/format';
import { activeCapability, modelCapability, totalTokens, trainingDuration } from '../../engine/formulas';
import { planFinetune, type RunPlan } from '../../engine/phases/training';
import type { FtSize, GameState, TrainingRun } from '../../engine/state';
import { failureText } from '../../content/failures';
import { TIPS } from '../../content/text';
import { LossChart } from '../LossChart';
import { Bar, Big, Btn, Panel, Row, Slider, Small, Tip } from '../kit';
import { HELP, HELP_P } from '../../content/help';
import type { Dispatch } from '../types';

export function PBreakdown({ plan }: { plan: RunPlan }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs">
        <Tip text={HELP_P} className="text-muted">
          Probabilidad de éxito
        </Tip>
      </div>
      <Big>{pct(plan.p.p)}</Big>
      <div className="flex flex-col gap-0.5 text-xs">
        {plan.p.terms.map((t) => (
          <div key={t.label} className="flex justify-between">
            <span className="text-muted">{t.label}</span>
            <span className={t.label.startsWith('Base') ? '' : t.value >= 0 ? 'text-teal' : 'text-bad'}>{pct(t.value, !t.label.startsWith('Base'))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunView({ s, run, d }: { s: GameState; run: TrainingRun; d: Dispatch }) {
  const failed = run.status === 'failed';
  const remaining = failed ? 0 : trainingDuration(s, run.C) * (1 - run.progress);
  const current = run.lossPoints[run.lossPoints.length - 1] ?? run.lossStart;
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1.5" style={{ flex: '3 1 280px', minWidth: 0 }}>
        <LossChart run={run} />
        <div className="flex justify-between text-xs text-muted">
          <span>loss actual {fmt(current)}</span>
          <span>
            {Math.round(run.progress * 100)} %{' '}
            {failed ? '· detenido' : Number.isFinite(remaining) ? `· quedan ${Math.ceil(remaining)} s` : '· sin GPUs asignadas'}
          </span>
        </div>
        <Bar value={run.progress} color={failed ? '#ff8a8a' : '#5fd3bc'} />
      </div>
      <div className="flex flex-col gap-1.5" style={{ flex: '2 1 200px' }}>
        <div className="text-xs">
        <Tip text={HELP_P} className="text-muted">
          Probabilidad de éxito
        </Tip>
      </div>
        <Big>{pct(run.pSuccess)}</Big>
        <Row label="Modelo" tip={HELP["Modelo"]} value={run.modelName} />
        <Row label="Capacidad esperada" tip={HELP["Capacidad esperada"]} value={fmt(run.targetCapability, { decimals: 0 })} />
        <Row label="Gastado" tip={HELP["Gastado"]} value={money(run.spent)} />
        {failed && (
          <>
            <Small tone="bad">{failureText(run.failureId)}</Small>
            {s.upgrades.checkpoints ? (
              <Btn primary onClick={() => d({ type: 'resumeRun' })} disabled={s.money < run.resumeCost} tip="Vuelves al último checkpoint. Pagas una parte de lo gastado.">
                Reanudar · {money(run.resumeCost)}
              </Btn>
            ) : (
              <Small>Sin checkpoints no se puede reanudar. Investígalos (20 ideas).</Small>
            )}
            <Btn onClick={() => d({ type: 'discardRun' })}>Descartar</Btn>
          </>
        )}
      </div>
    </div>
  );
}

export function TrainingPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const [size, setSize] = useState<FtSize>('small');
  const [frac, setFrac] = useState(1);
  const [epochs, setEpochs] = useState(2);
  const [ablation, setAblation] = useState(0);
  const avail = totalTokens(s);
  const tokens = avail * frac;
  const params = { size, tokens, epochs, ablation };
  const plan = planFinetune(s, params);
  const run = s.currentRun;
  const hasTeam = s.researchers + s.seniorResearchers > 0;
  const m = B.FT_MODELS[size];

  return (
    <Panel
      title="Entrenamiento"
      aside={run ? `Fine-tuning · ${run.modelName}` : `Fine-tuning · modelo ${size === 'small' ? 'pequeño 1B' : 'mediano 7B'} · ${epochs} época${epochs > 1 ? 's' : ''}`}
      grow={2}
      basis={520}
      collapsible={s.phase > 1}
      id="training"
    >
      {run ? (
        <RunView s={s} run={run} d={d} />
      ) : (
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2.5" style={{ flex: '3 1 280px', minWidth: 0 }}>
            <div className="flex flex-wrap gap-2">
              {(['small', 'medium'] as FtSize[]).map((k) => (
                <Btn key={k} small onClick={() => setSize(k)} className={size === k ? 'outline-2 outline outline-amber' : ''}>
                  {B.FT_MODELS[k].label}
                </Btn>
              ))}
            </div>
            <Small>
              Capacidad base {m.baseCap} · necesita {m.minGpus} GPU{m.minGpus > 1 ? 's' : ''}
            </Small>
            <Slider
              label="Tokens" tip={HELP["Tokens"]}
              value={frac}
              min={0}
              max={1}
              step={0.01}
              onChange={setFrac}
              display={`${fmt(tokens)} de ${fmt(avail)}`}
            />
            <Slider
              label="Épocas" tip={HELP["Épocas"]}
              value={epochs}
              min={1}
              max={5}
              step={1}
              onChange={setEpochs}
              display={`${epochs}${epochs > 3 ? ' · sobreajuste' : ''}`}
            />
            <Row label="Computación C = 6·N·D" tip={HELP["Computación C = 6·N·D"]} value={`${sci(plan.C)} FLOPs`} />
            <Row label="Capacidad esperada" tip={HELP["Capacidad esperada"]} value={fmt(plan.capability, { decimals: 0 })} />
            <Row label="Duración estimada" tip={HELP["Duración estimada"]} value={Number.isFinite(trainingDuration(s, plan.C)) ? `${Math.ceil(trainingDuration(s, plan.C * (1 + ablation)))} s` : '—'} />
          </div>
          <div style={{ flex: '2 1 200px' }}>
            <PBreakdown plan={planFinetune(s, { ...params, ablation: hasTeam ? ablation : 0 })} />
          </div>
        </div>
      )}
      {!run && (
        <div className="flex flex-wrap gap-2">
          <Btn primary onClick={() => d({ type: 'startFinetune', params })} disabled={!plan.ok} tip={plan.reason ?? TIPS.train}>
            Entrenar modelo · {money(plan.cost)}
          </Btn>
          {hasTeam &&
            B.ABLATION_OPTIONS.map((a, i) => (
              <Btn key={a} small onClick={() => setAblation(a)} className={ablation === a ? 'outline outline-2 outline-amber' : ''} tip={TIPS.ablation}>
                Ablaciones {Math.round(a * 100)} % · +{Math.round(B.ABLATION_BONUS[i] * 100)} %
              </Btn>
            ))}
        </div>
      )}
      {!run && plan.reason && <Small tone="warn">{plan.reason}</Small>}
      {s.models.length > 0 && (
        <div className="flex flex-col gap-0.5 text-xs">
          <div className="text-muted">Modelos</div>
          {s.models.slice(-4).map((mo) => (
            <div key={mo.id} className="flex justify-between">
              <span>
                {mo.name} {mo.id === s.activeModelId && <span className="text-amber">· en producción</span>}
              </span>
              <span>cap. {fmt(modelCapability(s, mo), { decimals: 0 })}</span>
            </div>
          ))}
          {s.activeModelId && <div className="text-muted">Capacidad activa: {fmt(activeCapability(s), { decimals: 0 })}</div>}
        </div>
      )}
    </Panel>
  );
}
