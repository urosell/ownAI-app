// Material de "plastilina": mate, con relieve irregular como de dedos. Todo procedural, sin texturas externas.
import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

let bump: THREE.CanvasTexture | null = null;

/** Textura de relieve: manchas suaves aleatorias, como huellas en la plastilina. */
function clayBump(): THREE.CanvasTexture {
  if (bump) return bump;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 4 + rnd() * 22;
    const light = rnd() > 0.5;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, light ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)');
    grad.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = grad;
    // Dibuja también en los bordes para que la textura se repita sin costura.
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      g.beginPath();
      g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  bump = new THREE.CanvasTexture(c);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return bump;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Material compartido por color (y brillo opcional). */
export function clay(color: string, emissive?: string, emissiveIntensity = 0): THREE.MeshStandardMaterial {
  const key = `${color}|${emissive ?? ''}|${emissiveIntensity}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0,
      bumpMap: clayBump(),
      bumpScale: 1.2,
      emissive: emissive ?? '#000000',
      emissiveIntensity,
    });
    cache.set(key, m);
  }
  return m;
}

type V3 = [number, number, number];

/** Caja redondeada de plastilina. */
export function Blob({
  size,
  position,
  rotation,
  color,
  radius,
  emissive,
  glow = 0,
}: {
  size: V3;
  position?: V3;
  rotation?: V3;
  color: string;
  radius?: number;
  emissive?: string;
  glow?: number;
}) {
  const r = radius ?? Math.min(...size) * 0.3;
  const mat = useMemo(() => clay(color, emissive, glow), [color, emissive, glow]);
  return (
    <RoundedBox args={size} radius={r} smoothness={4} position={position} rotation={rotation} material={mat} castShadow receiveShadow />
  );
}

export function Ball({ r, position, color, scale, shadow = true }: { r: number; position?: V3; color: string; scale?: V3; shadow?: boolean }) {
  const mat = useMemo(() => clay(color), [color]);
  return (
    <mesh position={position} scale={scale} material={mat} castShadow={shadow} receiveShadow>
      <sphereGeometry args={[r, 24, 18]} />
    </mesh>
  );
}

export function Pill({ r, length, position, rotation, color }: { r: number; length: number; position?: V3; rotation?: V3; color: string }) {
  const mat = useMemo(() => clay(color), [color]);
  return (
    <mesh position={position} rotation={rotation} material={mat} castShadow receiveShadow>
      <capsuleGeometry args={[r, length, 6, 16]} />
    </mesh>
  );
}

export function Disc({ r, h, position, rotation, color }: { r: number; h: number; position?: V3; rotation?: V3; color: string }) {
  const mat = useMemo(() => clay(color), [color]);
  return (
    <mesh position={position} rotation={rotation} material={mat} castShadow>
      <cylinderGeometry args={[r, r, h, 20]} />
    </mesh>
  );
}
