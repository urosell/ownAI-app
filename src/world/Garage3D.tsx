// El garaje (Fases 0–1) como diorama de plastilina. Lee el estado del juego; nunca lo cambia.
import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { GameState } from '../engine/state';
import { totalTokens } from '../engine/formulas';
import { Ball, Blob, Disc, Pill } from './clay';

type V3 = [number, number, number];

const C = {
  floor: '#9b8f94',
  wallBack: '#6d5a8e',
  wallLeft: '#5c4b7a',
  wood: '#c8925a',
  woodDark: '#9a6a3e',
  metal: '#8d8aa0',
  white: '#f2ede4',
  cardboard: '#c9a06a',
  amber: '#f5a623',
  teal: '#5fd3bc',
  pink: '#ff6fa8',
  red: '#e2574c',
  violet: '#b98cf0',
  dark: '#2e2a3a',
  skin: ['#f1c7a5', '#d9a07a', '#a86b48', '#7a4a32', '#f4d4bc'],
  shirt: ['#5fd3bc', '#ff6fa8', '#f5a623', '#7fa8f0', '#b98cf0', '#9fd36a'],
  hair: ['#2e2a3a', '#7a4a2a', '#d9b25f', '#a33b2a', '#4a4a4a'],
};

/** Dónde mira la cámara al abrir cada estación. */
export const FOCUS: Record<string, V3> = {
  pc: [1.2, 1.2, 1.0],
  rack: [3.6, 1.2, -1.8],
  annotators: [-3.0, 1.0, 1.2],
  data: [4.9, 0.8, 2.6],
  posters: [-5.6, 2.8, -0.6],
  whiteboard: [0, 2.6, -3.6],
  door: [-3.6, 1.6, -3.4],
};

// ── Interacción ──────────────────────────────────────────

function Station({
  id,
  label,
  enabled = true,
  labelAt,
  onSelect,
  children,
}: {
  id: string;
  label: string;
  enabled?: boolean;
  labelAt: V3;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const target = hover && enabled ? 0.06 : 0;
    g.current.position.y += (target - g.current.position.y) * Math.min(1, dt * 12);
  });
  useEffect(() => {
    document.body.style.cursor = hover && enabled ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hover, enabled]);
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (enabled) onSelect(id);
      }}
    >
      {children}
      {hover && enabled && (
        <Html position={labelAt} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-full bg-[#1f1c29]/90 border border-[#5b5470] px-2.5 py-0.5 text-xs text-[#ece8f4]">{label}</div>
        </Html>
      )}
    </group>
  );
}

// ── Piezas ───────────────────────────────────────────────

function Person({ position, i, rotY = 0, seated = false, typing = false }: { position: V3; i: number; rotY?: number; seated?: boolean; typing?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const phase = i * 1.7;
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.position.y = position[1] + (typing ? Math.abs(Math.sin(t * 9 + phase)) * 0.025 : Math.sin(t * 1.5 + phase) * 0.01);
  });
  const skin = C.skin[i % C.skin.length];
  const shirt = C.shirt[i % C.shirt.length];
  const hair = C.hair[(i * 3) % C.hair.length];
  const bodyY = seated ? 0.62 : 0.75;
  return (
    <group ref={g} position={position} rotation={[0, rotY, 0]}>
      <Pill r={0.2} length={seated ? 0.3 : 0.45} position={[0, bodyY, 0]} color={shirt} />
      <Ball r={0.19} position={[0, bodyY + 0.48, 0]} color={skin} />
      <Ball r={0.2} position={[0, bodyY + 0.58, -0.04]} scale={[1, 0.6, 1]} color={hair} />
      <Ball r={0.025} position={[-0.07, bodyY + 0.5, 0.17]} color={C.dark} />
      <Ball r={0.025} position={[0.07, bodyY + 0.5, 0.17]} color={C.dark} />
      {!seated && (
        <>
          <Pill r={0.07} length={0.3} position={[-0.09, 0.2, 0]} color={C.dark} />
          <Pill r={0.07} length={0.3} position={[0.09, 0.2, 0]} color={C.dark} />
        </>
      )}
    </group>
  );
}

function Table({ position, w, d, h = 0.9, color = C.wood, legs = C.woodDark }: { position: V3; w: number; d: number; h?: number; color?: string; legs?: string }) {
  const lx = w / 2 - 0.15;
  const lz = d / 2 - 0.15;
  return (
    <group position={position}>
      <Blob size={[w, 0.12, d]} position={[0, h, 0]} color={color} radius={0.05} />
      {[
        [-lx, -lz],
        [lx, -lz],
        [-lx, lz],
        [lx, lz],
      ].map(([x, z], k) => (
        <Blob key={k} size={[0.1, h, 0.1]} position={[x, h / 2, z]} color={legs} radius={0.04} />
      ))}
    </group>
  );
}

/** GPU de consumo: cae del cielo al comprarla y rebota. */
function Gpu({ position, busy, idx }: { position: V3; busy: boolean; idx: number }) {
  const g = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const led = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    if (born.current === null) born.current = t;
    const a = Math.min(1, (t - born.current) / 0.7);
    // Caída con rebote (easeOutBounce simplificado).
    const fall = a < 1 ? (1 - a) ** 2 * 2.5 - Math.sin(a * Math.PI) * 0.15 * (1 - a) : 0;
    g.current.position.y = position[1] + Math.max(0, fall);
    const squash = a < 1 && fall < 0.05 ? 0.85 : 1;
    g.current.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    if (led.current) {
      const on = busy ? Math.sin(t * 10 + idx) > 0 : true;
      (led.current.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 2.2 : 0.2;
    }
  });
  const ledMat = useMemo(() => new THREE.MeshStandardMaterial({ color: busy ? C.teal : C.amber, emissive: busy ? C.teal : C.amber, emissiveIntensity: 1.5 }), [busy]);
  return (
    <group ref={g} position={position}>
      <Blob size={[0.7, 0.16, 0.38]} position={[0, 0.08, 0]} color={C.dark} radius={0.06} />
      <Disc r={0.12} h={0.04} position={[-0.17, 0.17, 0]} color={C.metal} />
      <Disc r={0.12} h={0.04} position={[0.17, 0.17, 0]} color={C.metal} />
      <mesh ref={led} position={[0.3, 0.1, 0.2]} material={ledMat}>
        <sphereGeometry args={[0.035, 10, 8]} />
      </mesh>
    </group>
  );
}

function Cloud({ position, n }: { position: V3; n: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });
  return (
    <group ref={g} position={position}>
      <Ball r={0.45} position={[0, 0, 0]} color={C.white} shadow={false} />
      <Ball r={0.35} position={[-0.45, -0.08, 0]} color={C.white} shadow={false} />
      <Ball r={0.38} position={[0.45, -0.05, 0.05]} color={C.white} shadow={false} />
      {Array.from({ length: Math.min(n, 8) }, (_, k) => (
        <Blob key={k} size={[0.14, 0.14, 0.14]} position={[-0.42 + k * 0.12, -0.42, 0.25]} color={C.violet} emissive={C.violet} glow={0.8} radius={0.04} />
      ))}
    </group>
  );
}

function Lamp() {
  return (
    <group position={[0.8, 4.3, -0.4]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.8, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <Ball r={0.16} color={C.amber} />
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd27a" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, -0.2, 0]} intensity={6} distance={9} decay={1.6} color="#ffcf8a" castShadow={false} />
    </group>
  );
}

// ── Escena ───────────────────────────────────────────────

function Room({ s, onSelect }: { s: GameState; onSelect: (id: string) => void }) {
  const p1 = s.phase >= 1;
  const gpuCount = Math.min(12, s.gpus.consumer);
  const training = !!s.currentRun;
  const annotators = Math.min(6, s.annotators);
  const tokens = totalTokens(s);
  const boxes = p1 ? Math.max(tokens > 0 ? 1 : 0, Math.min(6, Math.ceil(Math.log10(tokens + 1) - 5))) : 0;
  const queue = Math.min(8, Math.ceil(s.users / 125));
  const ideas = Math.min(12, Math.floor(s.ideas / 5));
  const note = s.money < 100 ? C.red : s.money < 1000 ? C.amber : '#9fd36a';
  const posters = Math.min(5, s.marketing);
  const busy = s.queue.length > 0;

  return (
    <group>
      {/* Suelo y paredes */}
      <Blob size={[12, 0.4, 8]} position={[0, -0.2, 0]} color={C.floor} radius={0.15} />
      <Blob size={[12, 5, 0.4]} position={[0, 2.5, -4]} color={C.wallBack} radius={0.15} />
      <Blob size={[0.4, 5, 8]} position={[-6, 2.5, 0]} color={C.wallLeft} radius={0.15} />

      {/* Puerta del garaje → producto (usuarios haciendo cola) */}
      <Station id="door" label="Producto" enabled={p1} labelAt={[-3.6, 3.6, -3.4]} onSelect={onSelect}>
        <group position={[-3.6, 0, -3.75]}>
          {Array.from({ length: 6 }, (_, k) => (
            <Blob key={k} size={[2.8, 0.48, 0.14]} position={[0, 0.3 + k * 0.5, 0]} color={k % 2 ? '#b7b1c4' : '#c9c3d4'} radius={0.06} />
          ))}
        </group>
        {Array.from({ length: queue }, (_, k) => (
          <Person key={k} i={k + 3} position={[-4.6 + (k % 4) * 0.65, 0, -2.7 + Math.floor(k / 4) * 0.7]} rotY={0.2} />
        ))}
      </Station>

      {/* Pósters de marketing en la pared izquierda */}
      {Array.from({ length: posters }, (_, k) => (
        <Blob key={k} size={[0.06, 0.9, 0.65]} position={[-5.76, 2.6 + (k % 2) * 1.0, -2.4 + k * 0.9]} color={[C.pink, C.teal, C.amber, C.violet, C.red][k]} radius={0.03} />
      ))}

      {/* Pizarra → investigación */}
      <Station id="whiteboard" label="Investigación" enabled={s.phase === 1} labelAt={[0, 4.0, -3.6]} onSelect={onSelect}>
        <Blob size={[2.4, 1.5, 0.1]} position={[0, 2.7, -3.76]} color={C.white} radius={0.05} />
        <Blob size={[2.5, 0.08, 0.2]} position={[0, 1.92, -3.7]} color={C.metal} radius={0.03} />
        {Array.from({ length: ideas }, (_, k) => (
          <Ball key={k} r={0.07} position={[-0.95 + (k % 6) * 0.38, 3.05 - Math.floor(k / 6) * 0.4, -3.68]} color={[C.red, C.teal, C.violet][k % 3]} />
        ))}
        {/* Pósit del dinero */}
        <Blob size={[0.4, 0.4, 0.04]} position={[1.55, 3.1, -3.75]} rotation={[0, 0, 0.12]} color={note} radius={0.02} />
      </Station>

      <Lamp />

      {/* Mesa de la fundadora → ordenador */}
      <Station id="pc" label="Ordenador" labelAt={[1.2, 2.6, 1.0]} onSelect={onSelect}>
        <Table position={[1.2, 0, 1.0]} w={2.2} d={1.1} />
        <Blob size={[1.0, 0.65, 0.08]} position={[1.2, 1.45, 0.65]} color={C.dark} radius={0.04} />
        <Blob size={[0.88, 0.52, 0.02]} position={[1.2, 1.45, 0.7]} color={busy ? C.amber : '#7fa8f0'} emissive={busy ? C.amber : '#7fa8f0'} glow={busy ? 0.9 : 0.6} radius={0.01} />
        <Blob size={[0.12, 0.3, 0.12]} position={[1.2, 1.1, 0.62]} color={C.dark} radius={0.04} />
        <Blob size={[0.8, 0.05, 0.28]} position={[1.2, 0.99, 1.1]} color="#4a4560" radius={0.02} />
        <Disc r={0.08} h={0.16} position={[2.0, 1.04, 1.1]} color={C.white} />
        {/* Silla y fundadora */}
        <Blob size={[0.6, 0.1, 0.6]} position={[1.2, 0.5, 1.85]} color={C.dark} radius={0.04} />
        <Blob size={[0.6, 0.7, 0.1]} position={[1.2, 0.9, 2.15]} color={C.dark} radius={0.04} />
        <Person i={1} position={[1.2, 0, 1.75]} rotY={Math.PI} seated typing={busy} />
        {/* Cajas de pizza */}
        {Array.from({ length: Math.min(4, 1 + Math.floor(s.promptsAnswered / 200)) }, (_, k) => (
          <Blob key={k} size={[0.7, 0.07, 0.7]} position={[2.9, 0.04 + k * 0.08, 2.4]} rotation={[0, k * 0.3, 0]} color={C.cardboard} radius={0.02} />
        ))}
      </Station>

      {/* Mesa plegable de anotadores */}
      <Station id="annotators" label="Anotadores" labelAt={[-3.0, 2.4, 1.2]} onSelect={onSelect}>
        <Table position={[-3.0, 0, 1.0]} w={2.8} d={0.9} h={0.8} color={C.white} legs={C.metal} />
        {Array.from({ length: annotators }, (_, k) => {
          const x = -4.0 + (k % 3) * 1.0;
          const back = k >= 3;
          return (
            <group key={k}>
              <Blob size={[0.45, 0.3, 0.04]} position={[x, 1.02, back ? 0.85 : 1.15]} rotation={[back ? 0.3 : -0.3, back ? 0 : Math.PI, 0]} color="#4a4560" radius={0.02} />
              <Person i={k + 5} position={[x, 0, back ? 0.2 : 1.85]} rotY={back ? 0 : Math.PI} seated typing />
            </group>
          );
        })}
        {annotators === 0 && <Blob size={[0.9, 0.5, 0.04]} position={[-3.0, 1.2, 1.0]} color={C.white} radius={0.02} />}
      </Station>

      {/* Mesa de GPUs (+ nube de alquiladas) */}
      <Station id="rack" label={s.phase === 0 ? 'Primera GPU' : 'GPUs y entrenamiento'} labelAt={[3.6, 2.8, -1.8]} onSelect={onSelect}>
        <Table position={[3.6, 0, -1.8]} w={2.6} d={1.4} color={C.metal} legs={C.dark} />
        {Array.from({ length: gpuCount }, (_, k) => (
          <Gpu key={k} idx={k} busy={training} position={[2.75 + (k % 3) * 0.85, 0.96 + Math.floor(k / 3 / 2) * 0.2, -2.3 + (Math.floor(k / 3) % 2) * 0.55]} />
        ))}
        {/* Regleta y cables */}
        <Blob size={[0.6, 0.08, 0.14]} position={[3.6, 0.05, -1.0]} color={C.white} radius={0.03} />
        {s.gpus.rented > 0 && <Cloud position={[3.6, 3.4, -2.0]} n={s.gpus.rented} />}
      </Station>

      {/* Cajas de discos duros → datos */}
      <Station id="data" label="Datos" enabled={p1} labelAt={[4.9, 1.8, 2.6]} onSelect={onSelect}>
        {Array.from({ length: Math.max(boxes, p1 ? 1 : 0) }, (_, k) => (
          <Blob key={k} size={[0.6, 0.42, 0.48]} position={[4.6 + (k % 2) * 0.65, 0.21 + Math.floor(k / 2) * 0.43, 2.6]} rotation={[0, (k % 3) * 0.1 - 0.1, 0]} color={boxes > 0 ? C.cardboard : '#a88d68'} radius={0.05} />
        ))}
      </Station>
    </group>
  );
}

/** Lleva la cámara hacia la estación abierta y la devuelve al cerrar. */
function CameraRig({ selected, glance, mobile }: { selected: string | null; glance: string | null; mobile: boolean }) {
  const { camera, controls, size } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: OrbitControlsImpl | null; size: { width: number; height: number } };
  const anim = useRef(2);
  const aspect = size.width / Math.max(1, size.height);
  // Distancia para que quepa todo el garaje (≈14 m de ancho visto en diagonal) aunque la pantalla sea estrecha.
  const home = useMemo(() => {
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect);
    const dist = Math.max(13.4, 7.2 / Math.tan(hfov / 2));
    const dir = new THREE.Vector3(6.5, 5.3, 10.5).normalize();
    return { pos: dir.multiplyScalar(dist).add(new THREE.Vector3(0, 1.2, 0)), target: new THREE.Vector3(0, 1.2, 0), dist };
  }, [aspect, camera.fov]);
  const focus = glance ?? selected;
  useEffect(() => {
    anim.current = 1.4;
    if (controls) controls.maxDistance = Math.max(18, home.dist + 2);
  }, [focus, home, controls]);
  useFrame((_, dt) => {
    if (!controls || anim.current <= 0) return;
    anim.current -= dt;
    const f = FOCUS[focus ?? ''];
    const target = f ? new THREE.Vector3(...f) : home.target.clone();
    const pos = f ? target.clone().add(new THREE.Vector3(3.2, 3.0, 5.2).multiplyScalar(mobile ? 1.5 : 1)) : home.pos.clone();
    if (f && selected) {
      if (mobile) {
        // El cajón tapa la mitad de abajo: bajamos el punto de mira para que el objeto quede arriba.
        target.y -= 1.2;
      } else {
        // El cajón tapa la derecha: desplazamos la vista para que el objeto quede a la izquierda.
        const right = new THREE.Vector3(0.85, 0, -0.53).multiplyScalar(1.9);
        target.add(right);
        pos.add(right);
      }
    }
    const k = Math.min(1, dt * 4);
    controls.target.lerp(target, k);
    camera.position.lerp(pos, k);
    controls.update();
  });
  return null;
}

/** Cuando compras algo, la cámara echa un vistazo a dónde ha aparecido. */
function useGlance(s: GameState): string | null {
  const [glance, setGlance] = useState<string | null>(null);
  const prev = useRef({ gpu: s.gpus.consumer + s.gpus.rented, ann: s.annotators, mkt: s.marketing, res: s.researchers });
  const now = { gpu: s.gpus.consumer + s.gpus.rented, ann: s.annotators, mkt: s.marketing, res: s.researchers };
  useEffect(() => {
    const p = prev.current;
    let g: string | null = null;
    if (now.gpu > p.gpu) g = 'rack';
    else if (now.ann > p.ann) g = 'annotators';
    else if (now.mkt > p.mkt) g = 'posters';
    else if (now.res > p.res) g = 'whiteboard';
    prev.current = now;
    if (!g) return;
    setGlance(g);
    const t = setTimeout(() => setGlance(null), 2200);
    return () => clearTimeout(t);
  }, [now.gpu, now.ann, now.mkt, now.res]); // eslint-disable-line react-hooks/exhaustive-deps
  return glance;
}

export default function Garage3D({ s, selected, onSelect }: { s: GameState; selected: string | null; onSelect: (id: string) => void }) {
  const glance = useGlance(s);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const r = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: mobile ? [7, 8, 13] : [6.5, 6.5, 10.5], fov: 34, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelect('')}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#1b1726']} />
      <fog attach="fog" args={['#1b1726', 40, 70]} />
      <hemisphereLight args={['#ffe9d0', '#3a2f55', 0.9]} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={1.6}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-radius={6}
        shadow-bias={-0.0005}
      />
      <Room s={s} onSelect={onSelect} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5}
        minPolarAngle={0.5}
        maxPolarAngle={1.25}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={1.0}
        target={[0, 1.2, 0]}
      />
      <CameraRig selected={selected} glance={glance} mobile={mobile} />
    </Canvas>
  );
}
