// Fase 0 · IA de mentira
import { B } from '../../engine/balance';
import { money, pct, fmt } from '../../engine/format';
import { annotatorCost, annotatorRate, marketingCost, promptQuality, promptRate } from '../../engine/formulas';
import type { GameState } from '../../engine/state';
import { MARKETING_CAMPAIGNS, PROMPT_SAMPLES, TIPS } from '../../content/text';
import { Bar, Btn, Panel, Row, Small, Warn } from '../kit';
import type { Dispatch } from '../types';

export function InboxPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const head = s.queue[0];
  return (
    <Panel title="Bandeja de prompts" aside={`${s.queue.length}/${B.QUEUE_MAX} en cola`} grow={2} basis={420} collapsible={s.phase > 0} id="fake">
      {/* Botones arriba: la cola de abajo cambia de tamaño y no debe moverlos. */}
      <Btn primary onClick={() => d({ type: 'answerPrompt' })} disabled={s.queue.length === 0} tip={TIPS.answer}>
        Responder prompt · +{money(B.PROMPT_REWARD * promptQuality(s))}
      </Btn>
      {s.marketing < B.MARKETING_MAX ? (
        <Btn onClick={() => d({ type: 'buyMarketing' })} disabled={s.money < marketingCost(s)} tip={TIPS.marketing}>
          {MARKETING_CAMPAIGNS[s.marketing].label} · {money(marketingCost(s))} · +{Math.round(B.MARKETING_BONUS * 100)} % prompts
        </Btn>
      ) : (
        <Small tone="good">Marketing al máximo: ya no queda canal en el que no salgas.</Small>
      )}
      <Row label="Llegan" value={`${fmt(promptRate(s))} prompts/s`} />
      <Row label="Reputación" value={fmt(s.reputation, { decimals: 0 })} />
      <Row label="Calidad de respuesta" value={fmt(promptQuality(s))} />
      <Bar value={head ? head.ttl / B.PROMPT_TTL : 0} color={head && head.ttl < 6 ? '#ff8a8a' : '#5fd3bc'} height={6} />
      {/* Altura fija (5 prompts + "y N más") para que el panel no cambie de tamaño. */}
      <div className="flex flex-col gap-1.5 h-[150px] overflow-hidden" aria-label="Cola de prompts">
        {s.queue.length === 0 && <Small>No hay prompts. Disfruta del silencio.</Small>}
        {s.queue.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-[13px]">
            <span className="truncate flex-1">“{PROMPT_SAMPLES[p.id % PROMPT_SAMPLES.length]}”</span>
            <span className={`tabular-nums text-xs ${p.ttl < 6 ? 'text-bad' : 'text-muted'}`}>{Math.ceil(p.ttl)} s</span>
          </div>
        ))}
        {s.queue.length > 5 && <Small>… y {s.queue.length - 5} más</Small>}
      </div>
    </Panel>
  );
}

export function TeamPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cost = annotatorCost(s);
  const capacity = annotatorRate(s);
  const arrival = promptRate(s);
  const perAnnotator = capacity / Math.max(1, s.annotators);
  // Anotadores que sobran: aunque se despida a uno, los demás siguen cubriendo todo lo que llega.
  const idle = s.annotators > 0 ? Math.max(0, Math.floor((capacity - arrival) / perAnnotator)) : 0;
  return (
    <Panel title="Anotadores" aside="la IA es gente" collapsible={s.phase > 0}>
      <Row label="Anotadores" value={s.annotators} />
      <Row label="Pueden responder" value={`${fmt(capacity)} prompts/s`} />
      <Row label="Llegan" value={`${fmt(arrival)} prompts/s${s.reputation >= 100 && s.marketing < B.MARKETING_MAX ? ' (máx. por reputación: prueba marketing)' : ''}`} />
      <Row label="Sueldos" value={`−${fmt(s.annotators * B.ANNOTATOR_SALARY)} €/s`} tone="bad" />
      {idle > 0 && (
        <Warn label={`${idle} anotador${idle > 1 ? 'es' : ''} de sobra: cobran por esperar`} />
      )}
      {s.phase >= 1 && <Row label="Datos limpios generados" value={`${fmt(s.data.clean)} tokens`} tone="good" />}
      <Btn onClick={() => d({ type: 'hireAnnotator' })} disabled={s.money < cost} tip={TIPS.annotator}>
        Contratar anotador · {money(cost)}
      </Btn>
      {s.annotators > 0 && (
        <Btn onClick={() => d({ type: 'fireAnnotator' })} tip="Sin indemnización. Esto es una startup.">
          Despedir anotador · −{fmt(B.ANNOTATOR_SALARY)} €/s de sueldos
        </Btn>
      )}
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
