// Fase 3 · Laboratorio frontera
import { B } from '../../engine/balance';
import { fmt, money, pct } from '../../engine/format';
import { activeCapability, energyCost, energyPricePerMWh, gpuSlots, ownedGpus, poweredFraction, powerDemandMW, powerSupplyMW } from '../../engine/formulas';
import { datacenterCost, evalCost } from '../../engine/phases/frontier';
import type { GameState } from '../../engine/state';
import { TIPS } from '../../content/text';
import { Bar, Btn, Panel, Row, Small, Warn } from '../kit';
import type { Dispatch } from '../types';

export function DatacentersPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const demand = powerDemandMW(s);
  const supply = powerSupplyMW(s);
  const powered = poweredFraction(s);
  return (
    <Panel title="Centros de datos y energía" basis={360} id="datacenters">
      <Row label="GPUs propias / huecos" value={`${fmt(ownedGpus(s))} / ${fmt(gpuSlots(s))}`} />
      <Row label="Energía necesaria / disponible" value={`${fmt(demand)} / ${fmt(supply)} MW`} tone={powered < 1 ? 'bad' : undefined} />
      <Bar value={supply > 0 ? Math.min(1, demand / supply) : 1} color={powered < 1 ? '#ff8a8a' : '#5fd3bc'} />
      {powered < 1 && <Warn label="GPUs sin energía" value={pct(1 - powered)} />}
      <Row label="Precio medio" value={`${fmt(energyPricePerMWh(s))} €/MWh`} />
      <Row label="Factura eléctrica" value={`−${fmt(energyCost(s))} €/s`} tone="bad" />
      {s.datacenters.map((dc) => (
        <Small key={dc.id}>
          · {B.LOCATIONS.find((l) => l.id === dc.location)?.name}: {dc.buildRemaining > 0 ? `en obras, ${Math.ceil(dc.buildRemaining)} s` : 'operativo'}
        </Small>
      ))}
      {s.powerPlants.map((p) => (
        <Small key={p.id}>
          · {p.kind === 'solar' ? 'Parque solar' : 'Central nuclear'} ({fmt(p.mw)} MW): {p.buildRemaining > 0 ? `en obras, ${Math.ceil(p.buildRemaining)} s` : 'conectado'}
        </Small>
      ))}
      <div className="text-xs text-muted">Construir centro de datos (20.000 huecos · 50 MW · 120 s)</div>
      <div className="flex flex-col gap-2">
        {B.LOCATIONS.map((l) => (
          <Btn
            key={l.id}
            small
            onClick={() => d({ type: 'buildDatacenter', location: l.id })}
            disabled={s.money < datacenterCost(l.id)}
            tip={`${TIPS.datacenter} Energía ×${fmt(l.energyMult)}, regulación ×${fmt(l.regulation)}, subvención ${pct(l.subsidy)}.`}
          >
            {l.name} · {money(datacenterCost(l.id))}
          </Btn>
        ))}
      </div>
      <div className="text-xs text-muted">Energía</div>
      <div className="flex flex-wrap gap-2">
        <Btn small onClick={() => d({ type: 'addGrid', mw: B.GRID_STEP_MW })} disabled={s.gridMW >= B.GRID_MAX_MW} tip="Rápido, pero caro: 80 €/MWh. La red no da más de 150 MW.">
          Red +{B.GRID_STEP_MW} MW ({fmt(s.gridMW)}/{B.GRID_MAX_MW})
        </Btn>
        <Btn small onClick={() => d({ type: 'buildPlant', kind: 'solar' })} disabled={s.money < B.SOLAR_COST} tip="100 MW a 30 €/MWh. Tarda 90 s.">
          Parque solar · {money(B.SOLAR_COST)}
        </Btn>
        <Btn small onClick={() => d({ type: 'buildPlant', kind: 'nuclear' })} disabled={s.money < B.NUCLEAR_COST} tip={`${TIPS.nuclear} 1.000 MW a 20 €/MWh. Tarda 300 s.`}>
          Reabrir central nuclear · {money(B.NUCLEAR_COST)}
        </Btn>
      </div>
      <div className="text-xs text-muted">Chips propios</div>
      {s.ownChips ? (
        <Small tone="good">Chips propios en producción: GPUs −40 % y +25 % FLOP/s.</Small>
      ) : s.chipsRemaining > 0 ? (
        <>
          <Small>I+D de chips: quedan {Math.ceil(s.chipsRemaining)} s</Small>
          <Bar value={1 - s.chipsRemaining / B.CHIPS_SECONDS} color="#b98cf0" height={6} />
        </>
      ) : (
        <Btn small onClick={() => d({ type: 'researchChips' })} disabled={s.money < B.CHIPS_COST} tip={TIPS.chips}>
          Diseñar chips propios · {money(B.CHIPS_COST)} · 240 s
        </Btn>
      )}
    </Panel>
  );
}

export function RegulationPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const hearing = s.t < s.timed.hearingUntil;
  return (
    <Panel title="Regulación" id="regulation">
      <Row label="Cumplimiento normativo" value={fmt(s.compliance, { decimals: 0 })} tone={s.compliance < B.COMPLIANCE_FINE_THRESHOLD ? 'bad' : undefined} />
      <Bar value={s.compliance / 100} color={s.compliance < B.COMPLIANCE_FINE_THRESHOLD ? '#ff8a8a' : '#8fb4ff'} />
      {s.compliance < B.COMPLIANCE_FINE_THRESHOLD && <Warn label="Por debajo de 30: multas y comparecencias" />}
      {hearing && <Warn label="Comparecencia: lanzamientos bloqueados" value={`${Math.ceil(s.timed.hearingUntil - s.t)} s`} />}
      <Small>Lanzar sin evaluación previa: −15. Evaluar un modelo (60 s, 0,5 % de C): +10.</Small>
      <Btn onClick={() => d({ type: 'lobby' })} disabled={s.money < B.LOBBY_COST} tip={TIPS.lobby}>
        Lobby · {money(B.LOBBY_COST)} (+5, 10 % de escándalo)
      </Btn>
    </Panel>
  );
}

export function SafetyPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const canHire = s.researchers + s.seniorResearchers >= B.SAFETY_TEAM_COST_RESEARCHERS && s.ideas >= B.SAFETY_TEAM_COST_IDEAS;
  return (
    <Panel title="Seguridad" id="safety">
      <Row label="Seguridad" value={fmt(s.safety)} tone={s.safety >= B.END_AGI_SAFETY ? 'good' : 'warn'} />
      <Bar value={s.safety} color="#5fd3bc" />
      <Row label="Equipos de seguridad" value={s.safetyTeams} />
      <Row label="P(incidente grave) por lanzamiento" value={pct(B.INCIDENT_P * (1 - s.safety))} />
      {s.safetyTeams === 0 && <Small tone="warn">Sin equipo de seguridad: +20 % de ideas. Y de titulares.</Small>}
      <Btn onClick={() => d({ type: 'hireSafetyTeam' })} disabled={!canHire} tip={TIPS.safety}>
        Crear equipo · {B.SAFETY_TEAM_COST_RESEARCHERS} investigadores + {B.SAFETY_TEAM_COST_IDEAS} ideas
      </Btn>
      {s.safetyTeams > 0 && (
        <Btn onClick={() => d({ type: 'cutSafetyTeam' })} tip="Recuperas a los investigadores. La seguridad baja.">
          Recortar un equipo
        </Btn>
      )}
    </Panel>
  );
}

const AUTOMATIONS: { id: 'autoTrain' | 'autoBuy' | 'autoResearch'; label: string; text: string }[] = [
  { id: 'autoTrain', label: 'Auto-entrenamiento', text: 'Lanza el siguiente entrenamiento con la configuración óptima, hace el SFT y lanza el modelo.' },
  { id: 'autoBuy', label: 'Auto-compra', text: 'Compra GPUs, energía y centros de datos.' },
  { id: 'autoResearch', label: 'Investigación automática', text: 'Ideas ×2: el modelo investiga y compra mejoras.' },
];

export function AutomationPanel({ s, d }: { s: GameState; d: Dispatch }) {
  const cap = activeCapability(s);
  const locked = cap < B.AUTOMATION_CAP;
  return (
    <Panel title="Agentes" aside="investigación automatizada" id="automation">
      {locked && <Small>Con capacidad {B.AUTOMATION_CAP} el modelo puede empezar a hacer tu trabajo. Ahora: {fmt(cap, { decimals: 0 })}.</Small>}
      {AUTOMATIONS.map((a) =>
        s.automation[a.id] ? (
          <Small key={a.id} tone="good">
            {a.label}: activa. {a.text}
          </Small>
        ) : (
          <Btn key={a.id} onClick={() => d({ type: 'buyAutomation', id: a.id })} disabled={locked || s.ideas < B.AUTOMATION_COST[a.id]} tip={`${a.text} Oculta su panel manual.`}>
            {a.label} · {fmt(B.AUTOMATION_COST[a.id])} ideas
          </Btn>
        ),
      )}
    </Panel>
  );
}

export function IpoPanel({ s, d }: { s: GameState; d: Dispatch }) {
  return (
    <Panel title="Salida a bolsa" id="ipo">
      <Row label="Valoración" value={`${money(s.valuation)} / ${money(B.END_IPO_VALUATION)}`} />
      <Bar value={s.valuation / B.END_IPO_VALUATION} color="#F5A623" />
      <Row label="Trimestres seguidos con beneficio" value={`${s.board.profitStreak} / ${B.END_IPO_PROFIT_QUARTERS}`} />
      <Btn primary onClick={() => d({ type: 'goPublic' })} disabled={!s.ipoAvailable} tip="Tocas la campana. Se acaba la partida.">
        Salir a bolsa
      </Btn>
    </Panel>
  );
}

export function AutoNotice({ title, text }: { title: string; text: string }) {
  return (
    <Panel title={title} aside="automatizado">
      <Small>{text}</Small>
    </Panel>
  );
}

export function EvalButton({ s, d, id }: { s: GameState; d: Dispatch; id: string }) {
  const m = s.models.find((x) => x.id === id);
  if (!m || m.evaluated || s.phase < 3 || m.kind !== 'pretrain') return null;
  return (
    <Btn small onClick={() => d({ type: 'evaluateModel', id })} disabled={!!s.postRun || s.money < evalCost(m)} tip={TIPS.eval}>
      Evaluar antes de lanzar · {money(evalCost(m))} · 60 s
    </Btn>
  );
}
