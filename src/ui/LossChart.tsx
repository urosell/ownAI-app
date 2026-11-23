import { B } from '../engine/balance';
import type { TrainingRun } from '../engine/state';

/** Curva de loss en SVG hecho a mano (sin librerías). */
export function LossChart({ run }: { run: TrainingRun }) {
  const W = 300;
  const H = 100;
  const pts = run.lossPoints;
  const failed = run.status === 'failed';
  const max = Math.max(run.lossStart, ...pts) * 1.02;
  const min = Math.min(run.lossFinal, ...pts) * 0.98;
  const y = (L: number) => 4 + ((max - L) / (max - min || 1)) * (H - 8);
  const xNow = run.progress * W;
  // Puntos muestreados cada 1/LOSS_POINTS del progreso; el último (pico) cae en el punto actual.
  const xy = pts.map((L, i) => `${Math.min(xNow, (i * W) / B.LOSS_POINTS).toFixed(1)},${y(L).toFixed(1)}`);
  const lastY = y(pts[pts.length - 1] ?? run.lossStart);
  const projected = failed ? '' : `${xNow.toFixed(1)},${lastY.toFixed(1)} ${W},${y(run.lossFinal).toFixed(1)}`;
  const color = failed ? '#ff8a8a' : '#5fd3bc';
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      className="block bg-void"
      role="img"
      aria-label={`Curva de loss: de ${run.lossStart.toFixed(2)} a ${(pts[pts.length - 1] ?? 0).toFixed(2)}, ${Math.round(run.progress * 100)} % del entrenamiento${failed ? ', fallido' : ''}`}
    >
      {[25, 50, 75].map((g) => (
        <rect key={g} x={0} y={g} width={W} height={1} fill="#2a2438" />
      ))}
      <polyline points={xy.join(' ')} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {projected && <polyline points={projected} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
      <rect x={Math.min(W - 1, xNow)} y={0} width={1} height={H} fill="#F5A623" />
    </svg>
  );
}
