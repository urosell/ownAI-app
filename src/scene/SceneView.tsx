import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../engine/state';
import { resolveSprite, spritePosition, type Manifest } from './manifest';
import { isText, placeholderShapes } from './placeholders';
import { SCENE_H, SCENE_W, SCENES } from './scenes';
import { sceneData } from './variants';

const PLACEHOLDER_FPS = 4;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Reloj de animación (ms). Congelado a 0 si el usuario prefiere menos movimiento. */
function useAnimClock(reduced: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (reduced) {
      setNow(0);
      return;
    }
    const start = performance.now();
    const id = window.setInterval(() => setNow(performance.now() - start), 1000 / 8);
    return () => window.clearInterval(id);
  }, [reduced]);
  return now;
}

/** Escala entera (×1, ×2, ×3) que cabe en el contenedor; por debajo de 400 px escala fraccionaria. */
function useIntegerScale(ref: React.RefObject<HTMLDivElement | null>, maxHeight: number): number {
  const [scale, setScale] = useState(2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const maxByH = Math.floor(maxHeight / SCENE_H);
      const fit = w / SCENE_W;
      setScale(fit < 1 ? fit : Math.max(1, Math.min(Math.floor(fit), maxByH)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, maxHeight]);
  return scale;
}

interface Props {
  state: GameState;
  manifest: Manifest;
  onSlotClick?: (panel: string) => void;
  maxHeight?: number;
}

export function SceneView({ state, manifest, onSlotClick, maxHeight = 340 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const scale = useIntegerScale(wrap, maxHeight);
  const reduced = usePrefersReducedMotion();
  const now = useAnimClock(reduced);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const data = sceneData(state);
  const def = SCENES[data.scene];
  const slots = useMemo(() => [...def.slots].sort((a, b) => a.z - b.z), [def]);
  const phFrame = Math.floor((now / 1000) * PLACEHOLDER_FPS) % 2;
  const base = import.meta.env?.BASE_URL ?? '/';

  return (
    <div ref={wrap} className="w-full flex justify-center overflow-hidden" style={{ background: def.background }}>
      <svg
        width={SCENE_W * scale}
        height={SCENE_H * scale}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        shapeRendering="crispEdges"
        style={{ display: 'block', imageRendering: 'pixelated' }}
        role="img"
        aria-label={`${def.title}: ${slots.map((s) => s.desc).join(', ')}`}
      >
        {slots.map((slot) => {
          const variant = data.variants[slot.id];
          const found = resolveSprite(manifest, slot.id, variant);
          const clickable = !!slot.panel && !!onSlotClick;
          const onClick = clickable ? () => onSlotClick!(slot.panel!) : undefined;
          const cls = clickable ? 'cursor-pointer scene-slot' : undefined;

          if (found && !broken.has(found.name)) {
            const { sprite } = found;
            const pos = spritePosition(slot, sprite);
            const frames = sprite.frames ?? 1;
            const frame = frames > 1 ? Math.floor((now / 1000) * (sprite.fps ?? 4)) % frames : 0;
            return (
              <svg
                key={slot.id}
                x={pos.x}
                y={pos.y}
                width={sprite.w}
                height={sprite.h}
                viewBox={`${frame * sprite.w} 0 ${sprite.w} ${sprite.h}`}
                onClick={onClick}
                className={cls}
                data-slot={slot.id}
                data-sprite={found.name}
              >
                <image
                  href={base + sprite.file}
                  width={sprite.w * frames}
                  height={sprite.h}
                  style={{ imageRendering: 'pixelated' }}
                  onError={() => setBroken((b) => new Set(b).add(found.name))}
                />
              </svg>
            );
          }

          const shapes = placeholderShapes(slot.id, variant, data);
          return (
            <g key={slot.id} transform={`translate(${slot.x} ${slot.y})`} onClick={onClick} className={cls} data-slot={slot.id}>
              {clickable && <rect width={slot.w} height={slot.h} fill="transparent" />}
              {shapes.map((sh, i) =>
                isText(sh) ? (
                  <text
                    key={i}
                    x={sh.x}
                    y={sh.y}
                    fontSize={sh.size}
                    fill={sh.fill}
                    textAnchor={sh.anchor}
                    fontFamily="Silkscreen, monospace"
                  >
                    {sh.text}
                  </text>
                ) : sh.frame !== undefined && sh.frame !== phFrame ? null : (
                  <rect
                    key={i}
                    x={sh.x}
                    y={sh.y}
                    width={sh.w}
                    height={sh.h}
                    fill={sh.fill}
                    className={sh.blink === 1 ? 'blink' : sh.blink === 2 ? 'blink2' : undefined}
                  />
                ),
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
