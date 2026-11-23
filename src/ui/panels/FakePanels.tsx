// Fase 0 · IA de mentira
import { B } from '../../engine/balance';
import { money, pct, fmt } from '../../engine/format';
import { annotatorCost, annotatorRate, promptQuality, promptRate } from '../../engine/formulas';
import type { GameState } from '../../engine/state';
import { PROMPT_SAMPLES, TIPS } from '../../content/text';
import { Bar, Btn, Panel, Row, Small, Warn } from '../kit';
import type { Dispatch } from '../types';

export function InboxPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const head = s.queue[0];
  return (
    <Panel title="Bandeja de prompts" aside={`${s.queue.length}/${B.QUEUE_MAX} en cola`} grow={2} basis={420} collapsible={s.phase > 0} id="fake">
      <div className="flex flex-col gap-1.5" aria-label="Cola de prompts">
        {s.queue.length === 0 && <Small>No hay prompts. Disfruta del silencio.</Small>}
        {s.queue.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-[13px]">
            <span className="truncate flex-1">“{PROMPT_SAMPLES[p.id % PROMPT_SAMPLES.length]}”</span>
            <span className={`tabular-nums text-xs ${p.ttl < 6 ? 'text-bad' : 'text-muted'}`}>{Math.ceil(p.ttl)} s</span>
          </div>
        ))}
        {s.queue.length > 5 && <Small>… y {s.queue.length - 5} más</Small>}
      </div>
      {head && <Bar value={head.ttl / B.PROMPT_TTL} color={head.ttl < 6 ? '#ff8a8a' : '#5fd3bc'} height={6} />}
      <Row label="Llegan" value={`${fmt(promptRate(s))} prompts/s`} />
      <Row label="Reputación" value={fmt(s.reputation, { decimals: 0 })} />
      <Row label="Calidad de respuesta" value={fmt(promptQuality(s))} />
      <Btn primary onClick={() => d({ type: 'answerPrompt' })} disabled={s.queue.length === 0} tip={TIPS.answer}>
        Responder prompt · +{money(B.PROMPT_REWARD * promptQuality(s))}
      </Btn>
    </Panel>
  );
}

export function TeamPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cost = annotatorCost(s);
  return (
    <Panel title="Anotadores" aside="la IA es gente" collapsible={s.phase > 0}>
      <Row label="Anotadores" value={s.annotators} />
      <Row label="Responden" value={`${fmt(annotatorRate(s))} prompts/s`} />
      <Row label="Sueldos" value={`−${fmt(s.annotators * B.ANNOTATOR_SALARY)} €/s`} tone="bad" />
      {s.phase >= 1 && <Row label="Datos limpios generados" value={`${fmt(s.data.clean)} tokens`} tone="good" />}
      <Btn onClick={() => d({ type: 'hireAnnotator' })} disabled={s.money < cost} tip={TIPS.annotator}>
        Contratar anotador · {money(cost)}
      </Btn>
      {!s.templates && (
        <Btn onClick={() => d({ type: 'buyTemplates' })} disabled={s.money < B.TEMPLATES_COST} tip={TIPS.templates}>
          Plantillas de respuesta · {money(B.TEMPLATES_COST)}
        </Btn>
      )}
      {s.templates && <Small tone="good">Plantillas activas: +50 % velocidad, calidad 0,9.</Small>}
    </Panel>
  );
}

export function InvestorsPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const unlocked = s.totalEarned >= B.ANGEL_UNLOCK_EARNED;
  return (
    <Panel title="Inversores" aside={`${money(s.totalEarned)} ganados`} collapsible={s.phase > 0}>
      {!s.angelPitched ? (
        <>
          <Small>Con {money(B.ANGEL_UNLOCK_EARNED)} ganados en total, alguien querrá escuchar tu pitch.</Small>
          <Bar value={s.totalEarned / B.ANGEL_UNLOCK_EARNED} color="#F5A623" />
          <Btn onClick={() => d({ type: 'pitchAngels' })} disabled={!unlocked} tip={TIPS.pitch}>
            Pitch a inversores ángel · +{money(B.ANGEL_AMOUNT)}
          </Btn>
        </>
      ) : (
        <>
          <Warn label="Riesgo de auditoría (cada 60 s)" value={pct(s.auditRisk)} />
          <Small>Cuantos más anotadores, más fácil que alguien se dé cuenta de que la IA come bocadillos.</Small>
        </>
      )}
      {s.phase === 0 && (
        <Btn primary onClick={() => d({ type: 'buyFirstGpu' })} disabled={s.money < B.FIRST_GPU_COST} tip={TIPS.firstGpu}>
          Comprar primera GPU de segunda mano · {money(B.FIRST_GPU_COST)}
        </Btn>
      )}
    </Panel>
  );
}
