import type { ReactNode } from 'react';
import { money } from '../engine/format';
import type { GameState } from '../engine/state';
import { PHASE_INTRO, PHASE_NAMES } from '../content/text';
import { Btn } from './kit';
import type { Dispatch } from './types';

export function ModalFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fade-in bg-panel border-2 border-amber shadow-[6px_6px_0_#000] max-w-xl w-full p-5 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <h2 className="m-0 font-pixel text-xl font-normal text-amber">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const PHASE_HINTS: Record<number, string> = {
  1: 'Se desbloquean computación, datos, talento y fine-tuning. Elige un nicho, entrena un modelo y llega a 1.000 usuarios de pago.',
  2: 'Preentrena tus propios modelos, abre una API, gestiona el hype y sobrevive a la junta cada trimestre.',
  3: 'Centros de datos, energía, chips propios, regulación y seguridad. Elige cómo termina esto.',
};

export function Modals({ s, d, extra }: { s: GameState; d: Dispatch; extra?: ReactNode }) {
  const m = s.modal;
  if (!m) return null;
  if (m.kind === 'phase') {
    return (
      <ModalFrame title={`Fase ${m.phase} · ${PHASE_NAMES[m.phase]}`}>
        <p className="m-0">{PHASE_INTRO[m.phase]}</p>
        <p className="m-0 text-muted text-[13px]">{PHASE_HINTS[m.phase]}</p>
        <Btn primary onClick={() => d({ type: 'dismissModal' })}>
          Seguir
        </Btn>
      </ModalFrame>
    );
  }
  if (m.kind === 'lawsuit') {
    return (
      <ModalFrame title="Demanda por copyright">
        <p className="m-0">{s.log[0]?.text}</p>
        <div className="flex flex-col gap-2">
          <Btn onClick={() => d({ type: 'resolveLawsuit', choice: 'pay' })}>
            Pagar la multa · {money(m.amount)} (el riesgo baja a la mitad)
          </Btn>
          <Btn primary onClick={() => d({ type: 'resolveLawsuit', choice: 'settle' })}>
            Acuerdo de licencia · {money(m.settle)} (riesgo a 0, todo pasa a "con licencia")
          </Btn>
        </div>
      </ModalFrame>
    );
  }
  return <>{extra}</>;
}
