# OwnAI — Spec del prototipo jugable

> **OwnAI** *(nombre provisional)* — *Build your own AI empire and get rich with hype.*

Juego incremental web, sátira de las startups de IA con mecánicas realistas de cómo se entrenan y sirven los LLM. Inspiración directa: *Universal Paperclips* (empieza con un botón, los sistemas aparecen por fases, interfaz casi de texto).

**Objetivo de este prototipo:** que todo el juego sea jugable de principio a fin con una interfaz funcional y sobria, más una escena en pixel art hecha con placeholders (§14). **Nada de sprites ni arte definitivo todavía.** El arte vendrá después, así que la lógica tiene que estar totalmente separada de la UI, y la escena tiene que estar preparada para recibir sprites sin cambiar el código.

---

## 0. Instrucciones para Claude Code

1. Implementa **por hitos** (sección 12). Al acabar cada hito: `npm run build` y tests en verde, commit, y resumen de lo hecho. Después sigue con el siguiente.
2. Todos los números de balance viven en **un solo archivo** `src/engine/balance.ts`. Nada de números mágicos repartidos por el código.
3. El motor (`src/engine/`) es **TypeScript puro, sin React**. Así se puede testear y simular sin navegador.
4. Los textos del juego van en español, centralizados en `src/content/` (mensajes, eventos, nombres de fallos).
5. Si un valor de esta spec no funciona en la simulación de balance (sección 11), ajústalo en `balance.ts` y anota el cambio en `BALANCE_NOTES.md`.

## 1. Stack

- React + Vite + TypeScript + Tailwind.
- Estado: Zustand con el estado del motor serializable (JSON plano).
- Gráficos (curva de loss): SVG hecho a mano, sin librerías.
- Tests: Vitest.
- Sin backend. Guardado en `localStorage`.
- Tema: oscuro, acento ámbar `#F5A623`, tipografía monoespaciada para números y registro.

```
src/
  engine/        # lógica pura: tick, fórmulas, fases, eventos, guardado
    balance.ts
    state.ts     # tipos + estado inicial
    tick.ts      # avanza el estado dt segundos
    formulas.ts  # leyes de escalado, % de éxito, valoración, demanda...
    actions.ts   # acciones del jugador (comprar, entrenar, lanzar...)
    events.ts
    board.ts     # junta trimestral
    endings.ts
    save.ts
  content/       # textos: mensajes, eventos, fallos, finales
  ui/            # componentes React por panel
  sim/           # simulador headless de balance
```

## 2. Motor

- **Tick:** 10 por segundo (`dt = 0.1`). `tick(state, dt)` es una función pura que devuelve el nuevo estado.
- **Compresión temporal:** 1 segundo real = 1 hora de juego (`GAME_HOURS_PER_SECOND = 1`, usado para la computación). Un **trimestre** = 180 s reales (a partir de la Fase 2).
- **Aleatoriedad:** RNG con semilla guardada en el estado (p. ej. mulberry32), para que las partidas sean reproducibles en tests y en la simulación.
- **Sin progreso offline** en el prototipo (como Paperclips). Si la pestaña pierde el foco, el juego sigue mientras pueda; al volver, procesa como máximo 60 s acumulados.
- **Formato de números:** `1,5 k`, `2,3 M`, `4,1 mil M` (miles de millones), `1,2 B` (billones). Dinero en €.
- **Debug:** con `?debug=1`, panel con velocidad ×1/×10/×100, +dinero, +GPUs, saltar a fase N, forzar evento y mostrar el % de éxito desglosado.

## 3. Estado (resumen)

```ts
type Phase = 0 | 1 | 2 | 3 | 4;

interface GameState {
  phase: Phase;
  t: number;                 // segundos reales jugados
  rngSeed: number;
  money: number;
  totalEarned: number;
  reputation: number;        // 0–100, fase 0–1
  hype: number;              // 0–100
  expectation: number;       // deuda de expectativas (escala capacidad 0–100)
  valuation: number;
  dilution: number;          // % de la empresa que ya no es tuya
  // fase 0
  queue: Prompt[]; annotators: number; templates: boolean; auditRisk: number;
  // compute
  gpus: { consumer: number; datacenter: number; rented: number };
  gpuAlloc: number;          // 0–1, fracción para entrenamiento (resto: inferencia)
  // datos (en tokens)
  data: { clean: number; scraped: number; licensed: number; synthetic: number };
  lawsuitRisk: number;
  // talento
  researchers: number; seniorResearchers: number; equityPool: number; ideas: number;
  // modelos
  models: Model[]; activeModelId: string | null; currentRun: TrainingRun | null;
  failedStreak: number;
  // producto
  users: number; apiPrice: number; efficiency: number; contracts: Contract[];
  // fase 3
  datacenters: Datacenter[]; powerMW: number; ownChips: boolean;
  safety: number;            // 0–1
  compliance: number;        // 0–100
  rivals: Rival[];
  // meta
  upgrades: Record<string, boolean>;
  board: BoardState;
  log: LogEntry[];
  ending: EndingId | null;
  prestige: { papers: number; runs: number; endingsSeen: EndingId[] };
}
```

## 4. Fórmulas centrales

### 4.1 Capacidad del modelo (ley de escalado Chinchilla)

Se usan los coeficientes reales del paper de Chinchilla (Hoffmann et al., 2022). `N` = parámetros y `D` = tokens de entrenamiento, ambos en unidades absolutas.

```
L(N, D) = E + A / N^α + B / D^β
A = 406.4, B = 410.7, α = 0.34, β = 0.28, E = 1.69   (E se reduce con investigación)
```

Conversión a **capacidad 0–100**, que es lo que ve el jugador:

```
capacidad = clamp( 100 × (L_REF − L) / (L_REF − E_BASE), 0, 100 ),  L_REF = 3.0, E_BASE = 1.69
```

Referencia: 1 mil M de parámetros con 20 mil M de tokens da ≈ 32; 1 billón de parámetros con 20 billones de tokens da ≈ 91. Para pasar de ~95 hay que bajar `E` con investigación (§9).

**Computación necesaria:** `C = 6 × N × D` FLOPs.
**Óptimo:** `D ≈ 20 × N`. La UI muestra un indicador "eficiencia de escalado" que compara la capacidad obtenida con la que darían los mismos FLOPs repartidos de forma óptima.

### 4.2 Throughput de computación

| GPU | FLOP/s efectivos | Precio | Consumo | Disponible en |
|---|---|---|---|---|
| Consumo (2ª mano) | 1e14 | 1.500 € × 1,12ⁿ | 0,05 €/s | Fase 0 (final) |
| Datacenter | 4e14 | 30.000 € × 1,03ⁿ | 0,4 €/s | Fase 2 |
| Alquilada (nube) | 4e14 | 3 €/s por GPU, sin compra | — | Fase 1 |

FLOPs por segundo real = `Σ GPUs × FLOP/s × 3600 × gpuAlloc`.
Con chips propios (Fase 3): precio de GPU −40 % y FLOP/s +25 %.

### 4.3 Probabilidad de éxito del entrenamiento

```
P = P_fase + b_infra + b_ablaciones + b_equipo + b_aprendizajes + b_papers − k × max(0, log10(C) − 20)
P = clamp(P, 0.05, 0.97)
```

| Término | Valor |
|---|---|
| `P_fase` | Fase 1: 0,25 · Fase 2: 0,45 · Fase 3: 0,60 |
| `b_infra` | Suma de mejoras: checkpoints +0,05, monitorización +0,05, red rápida +0,05, cluster propio +0,05 (máx. 0,20) |
| `b_ablaciones` | El jugador elige gastar un 0 / 5 / 10 % extra de C en experimentos previos: +0 / +0,08 / +0,12 |
| `b_equipo` | +0,02 por investigador y +0,04 por sénior (máx. 0,20) |
| `b_aprendizajes` | +0,02 por cada fallo consecutivo (máx. 0,10); se reinicia al acertar |
| `b_papers` | +0,01 por paper de prestigio (máx. 0,10) |
| `k` | 0,04 |

**Momento del fallo:** se decide al iniciar el entrenamiento (con el RNG) y ocurre en un punto aleatorio entre el 20 % y el 90 % del progreso. La curva de loss muestra un pico y se corta.
**Coste del fallo:** sin checkpoints se pierde toda la computación gastada; con checkpoints se puede **reanudar** desde el último checkpoint pagando el 30–60 % de lo gastado (aleatorio).
**Tipos de fallo** (en `content/failures.ts`, se elige uno al azar con un texto satírico): pico de loss, divergencia, bug del tokenizador, datos duplicados, "el modelo solo responde en mayúsculas", nodo de la GPU 37 caído, un becario hizo `rm -rf` sobre los checkpoints (solo sin la mejora de monitorización), etc.

### 4.4 Curva de loss en vivo

Durante el entrenamiento se dibuja `L(N, D_visto)` con ruido (±2 %), donde `D_visto` crece con el progreso. Si el entrenamiento va a fallar, en el punto de fallo hay un pico ×1,5–3 y la línea se vuelve roja.

### 4.5 Economía de inferencia (Fase 2+)

- Capacidad de servicio (tokens/s) = `GPUs_inferencia × 2000 × eficiencia × (7e9 / N)`
- Demanda (tokens/s) = `DEMANDA_BASE × (capacidad/50)^3 × (precio_mercado / apiPrice)^1.5 × (1 + hype/100)`
- Tokens servidos = `min(capacidad de servicio, demanda)`. Si la demanda supera en más de un 20 % lo que puedes servir, aparecen avisos de latencia y la reputación baja.
- Ingresos/s = `servidos × apiPrice / 1e6` (el precio va en €/millón de tokens).
- `precio_mercado` empieza en 10 € y baja un 15 % con cada lanzamiento de un rival o de pesos abiertos.
- Optimizaciones: cuantización (eficiencia ×1,8, capacidad −1), destilación (×2, −3), caché de contexto (×1,3).
- `DEMANDA_BASE` = 5e5 tokens/s (ajustable).

### 4.6 Hype, expectativas y valoración

- El hype decae un 0,3 % por segundo hacia 0.
- **Prometer** (botón con cooldown de 60 s): hype +15, expectativa +8. Los textos van en una lista ("AGI en 18 meses", "nuestro modelo razona como un doctorando", "esto lo cambia todo"...).
- **Lanzar un modelo**: `gap = max(0, expectativa − capacidad)`. La valoración se multiplica por `(1 − 0,02 × gap)`, el hype sube `+capacidad/5 − gap` y la expectativa pasa a `capacidad`.
- **Valoración:** `V = ARR × (5 + hype/10) + 1e6 × capacidad_activa^1.5`, donde ARR = ingresos/s × 31.536.000.
- **Ronda de financiación** (cooldown de 1 trimestre): recibes `0,2 × V` y la dilución aumenta en 15 × (1 − dilución) puntos. Con un 90 % de dilución ya no hay más rondas.

## 5. Fases

### Fase 0 · IA de mentira (objetivo: 5–10 min)

- Llegan prompts a 0,5 por segundo. Cada uno caduca en 20 s y la cola máxima es de 10.
- **Responder prompt** (botón): +1 € × calidad. Calidad inicial 1,0. Si un prompt caduca: reputación −0,5.
- **Contratar anotador**: 15 € × 1,15ⁿ. Sueldo 0,2 €/s. Responde 0,3 prompts por segundo.
- **Plantillas de respuesta** (50 €): velocidad de los anotadores +50 % y calidad 0,9.
- La tasa de llegada de prompts sube con la reputación: `0,5 × (1 + reputación/50)`.
- **Pitch a inversores ángel** (se desbloquea con 200 € ganados en total): +2.000 €. Activa la **auditoría**: cada 60 s, `P(te pillan) = 0,02 × anotadores`. Si te pillan, pierdes el 50 % del dinero, reputación −20 y sale un titular satírico.
- **Transición:** botón "Comprar primera GPU de segunda mano" (1.500 €), que pasa a la Fase 1. Mensaje: *"Por fin una IA de verdad. Más o menos."*
- **Herencia:** cada prompt respondido por un anotador genera 2.000 tokens de datos limpios para la Fase 1.

### Fase 1 · Garaje (objetivo: 15–25 min)

- Se desbloquean computación, datos, talento y fine-tuning.
- **Fine-tuning:**
  - Modelo base abierto: Pequeño (1 mil M de parámetros, capacidad base 25, 1 GPU) o Mediano (7 mil M, base 38, ≥4 GPUs por memoria).
  - Tokens: un control deslizante sobre los datos disponibles.
  - Épocas: de 1 a 5, con factor `[0,7; 1,0; 1,1; 1,0; 0,8]`. Más allá de 3 épocas hay sobreajuste.
  - `capacidad = base + 20 × (1 − e^(−tokens/2e8)) × factor_épocas × calidad_datos`
  - `C = 6 × N × tokens × épocas`. Duración mínima de 10 s.
- **Datos:**
  - Limpios: los de los anotadores, calidad 1,0.
  - Scraping (activable): +2e6 tokens/s con calidad 0,8, y el riesgo de demanda sube 0,1 por cada 1e8 tokens.
  - Dataset con licencia: 500 € por 5e7 tokens, calidad 1,0.
  - `calidad_datos` = media ponderada de las fuentes.
- **Producto: wrapper de nicho.** El jugador elige uno: "ChatGPT para dentistas", "abogados", "astrólogos" o "agencias de marketing".
  - Usuarios objetivo = `capacidad² × 2 × (1 + reputación/100)`. Los usuarios reales se acercan al objetivo un 2 % por segundo.
  - Ingresos: 0,05 €/s por usuario. Coste de inferencia: 0,01 €/s por usuario.
- **Benchmark propio:** muestra la capacidad. Al activar *contaminar benchmark*, la puntuación mostrada sube +10 pero la real no cambia. Cada minuto hay un 5 % de probabilidad de que se descubra: hype −20 y reputación −15.
- **Investigador:** 5.000 € × 1,25ⁿ, sueldo 2 €/s. Genera 0,1 ideas por segundo. El primero desbloquea las ablaciones.
- **Transición:** al llegar a 1.000 usuarios de pago se cierra la **Serie A** (+500.000 €) y empieza la Fase 2.

### Fase 2 · Scale-up (objetivo: 30–45 min)

- **Preentrenamiento propio** con la ley de escalado (§4.1). El jugador elige N (controles en escala logarítmica de 1e9 a 1e11) y D; la UI muestra C, la duración estimada, el coste y la P(éxito) desglosada.
- **Post-entrenamiento:**
  - SFT: cuesta el 1 % de la C del preentrenamiento y da capacidad útil +5. Sin SFT, el modelo base no se puede lanzar como producto.
  - RLHF: control de *amabilidad* de 0 a 100. Por debajo de 40: escándalo con P = (40 − x)% por minuto. Por encima de 85: el modelo rechaza peticiones legítimas y la demanda baja `(x − 85) × 2 %`. Óptimo: 60–75.
- **API:** el jugador fija `apiPrice`, reparte GPUs entre entrenamiento e inferencia (`gpuAlloc`) y compra optimizaciones (§4.5).
- **Hype y deuda de expectativas** (§4.6). El panel muestra expectativa frente a capacidad como dos barras.
- **Guerra de talento:**
  - Investigador sénior: 50.000 € × 1,3ⁿ, sueldo 20 €/s, 0,5 ideas por segundo.
  - Equity: el jugador asigna un % del pool.
  - Cada trimestre, `P(fuga) = 0,1 × investigadores/10 × (1 − equity)`. Una fuga se lleva al 20–50 % del equipo, y si se van 5 o más, fundan un rival nuevo.
- **Contratos enterprise:** se ofrecen cada 1–2 trimestres. Piden una capacidad mínima y una cantidad de tokens por segundo reservada, y pagan un ingreso fijo por segundo. Incumplir el SLA cuesta 3 veces el ingreso perdido. Los textos piden siempre "agentes".
- **Rondas de financiación** (§4.6).
- **Junta trimestral** (§7).
- **Rivales:** 3 laboratorios con nombres satíricos. Su capacidad sigue `cap(t) = cap_max / (1 + e^(−r(t − t0)))`, con parámetros distintos para cada uno. Lanzan modelo cada 2–4 trimestres.
- **Transición:** tu modelo activo entra en el top 3 del ranking (frente a los rivales) o V ≥ 1e10 €.

### Fase 3 · Laboratorio frontera (objetivo: 30–45 min)

- **Centros de datos:** construir uno cuesta 500 M€ y tarda 120 s. Cada uno tiene 20.000 huecos para GPU y necesita 50 MW. Hay 3 ubicaciones con distinto precio de energía, regulación y subvención.
- **Energía:** cada GPU consume 1 kW. Las opciones son contrato de red (80 €/MWh, rápido), parque solar (200 M€ por 100 MW, 90 s, 30 €/MWh) y **reabrir una central nuclear** (3.000 M€ por 1.000 MW, 300 s, 20 €/MWh). Si no hay energía suficiente, las GPUs sin alimentar no rinden.
- **Chips propios:** I+D de 2.000 M€ y 240 s (§4.2).
- **Regulación:** el cumplimiento normativo (0–100) baja con cada lanzamiento sin evaluación. Una evaluación previa al lanzamiento cuesta 60 s y 0,5 % de C, y sube el cumplimiento +10. Por debajo de 30 hay multas (5 % de los ingresos de un trimestre) y comparecencias, que bloquean los lanzamientos durante 90 s. El lobby cuesta dinero y sube el cumplimiento +5, pero tiene una probabilidad de escándalo del 10 %.
- **Seguridad (0–1):** sube con un equipo de seguridad (cuesta investigadores y ideas). Cada lanzamiento tiene `P(incidente grave) = 0,15 × (1 − seguridad)`. Un incidente supone hype −40, regulación −30 y un evento de prensa. Recortar el equipo da un 20 % más de ideas.
- **Agentes e investigación automatizada:** con capacidad ≥ 85 se desbloquean:
  - Auto-entrenamiento: lanza el siguiente entrenamiento con la configuración óptima.
  - Auto-compra de GPUs y energía.
  - Ideas ×2 (el modelo investiga).
  - Cada automatización **oculta** un panel manual, de modo que la interfaz se va simplificando.
- **Transición a la Fase 4:** se cumple alguna condición de final (§8).

## 6. Eventos aleatorios

Se comprueban cada 30 s. Cada evento tiene una probabilidad base, condiciones de fase y un cooldown. Los textos van en `content/events.ts` con 2–3 variantes por evento.

| Evento | Fase | P (por comprobación) | Efecto |
|---|---|---|---|
| Rival libera pesos abiertos | 2+ | 4 % | precio de mercado −25 % |
| Escasez de GPUs | 1+ | 3 % | precio de GPU ×1,5 durante 2 trimestres |
| Jailbreak viral | 2+ | 3 % × (1 − seguridad) | hype −15 |
| Alucinación en un juicio | 1+ | 2 % | reputación −10, hype −10 |
| Demanda por copyright | 1+ | `lawsuitRisk` % | multa del 10 % del dinero o acuerdo de licencia |
| Paper viral | 1+ | 2 % × investigadores | coste de contratación −30 % durante 1 trimestre |
| Influencer dice que tu modelo es "AGI" | 2+ | 2 % | hype +20, expectativa +10 |
| Despido y readmisión del CEO | 2+ | solo por la junta (§7) | todo congelado 20 s, hype −10 |

## 7. Junta trimestral (Fase 2+)

- Cada 180 s se abre un modal (el juego se pausa) con los KPI del trimestre: ARR objetivo (`max(1,5 × media del ARR de los últimos 3 trimestres, 1e6)`) y capacidad objetivo (la del líder de los rivales − 5).
- Si se cumplen: valoración +10 % y un mensaje de felicitación con una dosis de condescendencia.
- Si no, el jugador elige **una** opción:

| Opción | Efecto inmediato | Coste |
|---|---|---|
| Maquillar métricas | Se da por cumplido | Expectativa +12 |
| Prometer AGI | Hype +25 | Expectativa +20 |
| Pivotar a agentes | Ronda puente de 0,05 × V × 0,5^(pivotes previos) | Vendes un 5 % de lo que te queda, valoración −10 %, los usuarios de los wrappers se reinician. Las acciones se pueden recomprar luego al 150 % de su valor |
| Recortar plantilla | Sueldos −30 % | Investigadores −25 %, P(fuga) ×2 el siguiente trimestre |
| Decir la verdad | Valoración −10 % | La próxima ronda da ×1,2 y la junta te tiene más paciencia |

- Si se incumple 2 trimestres seguidos sin "decir la verdad", ocurre el evento de **despido y readmisión** el mismo fin de semana.

## 8. Finales

Se comprueban en cada tick a partir de la Fase 2. Al cumplirse uno, se muestra una pantalla de texto (como en Paperclips) con el resumen de la partida y el botón de prestigio.

| Final | Condición |
|---|---|
| AGI | capacidad ≥ 98 y seguridad ≥ 0,6 |
| AGI sin frenos | capacidad ≥ 98 y seguridad < 0,6 (final oscuro, sin violencia explícita) |
| Salida a bolsa | Fase 3, V ≥ 5e11 € y beneficio positivo 2 trimestres seguidos → aparece el botón "Salir a bolsa" |
| Adquisición | dinero < 0 durante 60 s seguidos y capacidad ≥ 60 |
| Cierre | dinero < 0 durante 60 s seguidos y capacidad < 60 |
| Estalla la burbuja | expectativa > 1,6 × capacidad y V ≥ 1e9 € |

En las Fases 0 y 1 el dinero no puede bajar de 0: si no puedes pagar sueldos, se va gente.

## 9. Investigación (ideas)

Las ideas las generan los investigadores y se gastan en mejoras. Todas están en `balance.ts`.

| Mejora | Coste (ideas) | Efecto | Fase |
|---|---|---|---|
| Checkpoints | 20 | Permite reanudar y +0,05 P | 1 |
| Monitorización | 40 | +0,05 P | 1 |
| Red rápida | 150 | +0,05 P | 2 |
| Cuantización | 100 | Eficiencia ×1,8 | 2 |
| Destilación | 250 | Eficiencia ×2 | 2 |
| Caché de contexto | 200 | Eficiencia ×1,3 | 2 |
| Datos sintéticos | 300 | Fuente de datos gratis; si pasan del 40 % del dataset, capacidad −(exceso × 0,3) (*model collapse*) | 2 |
| Nueva arquitectura (×5 niveles) | 500 × 2ⁿ | E × 0,97 | 2–3 |
| Razonamiento | 2.000 | Capacidad +4 en los modelos nuevos | 3 |
| Cluster propio | 1.000 | +0,05 P | 3 |

## 10. Prestigio

- Al terminar cualquier final: papers = `floor(capacidad_máx / 10) + 2` si es la primera vez que ves ese final.
- Cada paper: +0,01 P (máx. 0,10) y coste de investigadores −2 %.
- Modificadores desbloqueables (se eligen al empezar): "Empiezas con 2 GPUs", "Un rival menos", "Regulación estricta (más papers)", "Mercado en burbuja (hype ×2, expectativa ×2)".

## 11. Guardado y simulación de balance

- Autoguardado cada 10 s en `localStorage` (`ownai_save_v1`), con número de versión y migraciones.
- Exportar e importar partida como texto base64.
- **`npm run sim`**: script en `src/sim/` que juega una partida con un bot sencillo y codicioso (compra lo más barato que mejora los ingresos, entrena cuando P ≥ 50 %, nunca promete) a velocidad máxima con una semilla fija. Imprime una tabla con la duración de cada fase en minutos de juego y el final alcanzado. Se ejecuta con 20 semillas y muestra la media y el rango.
- **Objetivo de balance:** Fase 0 entre 5 y 10 min, Fase 1 entre 15 y 25, Fase 2 entre 30 y 45 y Fase 3 entre 30 y 45. Partida completa entre 1,5 y 2,5 horas para el bot (un humano tardará más).

## 12. Hitos

1. **Esqueleto:** Vite, Tailwind, motor con tick y RNG, guardado, panel de debug, registro de mensajes, capa de escena con la escena `garage` en placeholders (§14). **Fase 0 completa y jugable.**
2. **Fase 1:** GPUs, datos, fine-tuning con P(éxito), curva de loss, fallos, wrapper, benchmark, investigadores, ideas y mejoras de la Fase 1.
3. **Fase 2:** preentrenamiento con Chinchilla, post-entrenamiento, API e inferencia, hype y expectativas, valoración y rondas, junta, rivales, contratos y eventos.
4. **Fase 3 y finales:** centros de datos, energía, chips, regulación, seguridad, automatización, finales y prestigio.
5. **Balance:** `npm run sim`, ajuste de `balance.ts` hasta cumplir los objetivos de la §11 y `BALANCE_NOTES.md`.

## 13. Interfaz del prototipo

- Una sola página. Arriba, una barra fija con dinero, ingresos por segundo, fase, valoración y hype.
- Debajo de la barra, la escena en pixel art (§14).
- Debajo de la escena, columnas de paneles (1 columna en móvil, 2–3 en escritorio) que **aparecen** al desbloquearse, con un fundido breve. Los paneles de fases anteriores se pueden plegar.
- A la derecha (o abajo en móvil), el **registro**: las últimas 50 entradas, con un tipo (info, éxito, fallo, prensa o junta) y su color.
- Los botones muestran el coste y se desactivan si no puedes pagarlo. Al pasar el ratón por encima (o mantener pulsado en móvil) se ve una explicación corta, con un poco de sátira y un dato real.
- Fuera de la escena, sin imágenes ni arte: solo texto, bordes, barras de progreso y la curva de loss en SVG. Títulos en una fuente pixel (Silkscreen) y el resto en IBM Plex Mono, como en la maqueta.
- Todos los componentes reciben datos del estado y lanzan acciones; **ninguna lógica de juego en la UI**. Así la capa visual de después podrá sustituirse entera.

## 14. Capa de escena (pixel art con huecos para assets)

Encima de los paneles, debajo de la barra superior, hay una **escena en pixel art** que crece con la empresa. En el prototipo se dibuja con rectángulos (placeholders); más adelante cada placeholder se sustituirá por un sprite **sin tocar el código del juego**.

Referencia visual: el canvas "OwnAI — Pantalla principal" (garaje de la Fase 1 y oficina de la Fase 2), que el usuario te pasará como captura o enlace.

### 14.1 Cómo funciona

- La escena tiene una resolución lógica fija de **400 × 110 px**, escalada a número entero (×2, ×3…) con `image-rendering: pixelated`. Se renderiza en un `<canvas>` o en un SVG con `shape-rendering: crispEdges`.
- Cada fase tiene su escena: `garage` (fases 0–1), `office` (fase 2), `campus` (fase 3) y `ending` (fase 4).
- Una escena es una lista de **huecos (slots)** con nombre, posición, tamaño y capa (z). Ejemplo: `desk`, `laptop`, `founder`, `gpu_rack`, `whiteboard`, `neon_sign`, `pizza_boxes`.
- Cada hueco se pinta con un **sprite** si existe en el manifiesto; si no, con su placeholder (rectángulos de colores definidos en el propio slot). Así se pueden ir añadiendo assets de uno en uno.
- Los huecos reaccionan al estado mediante **variantes**: `gpu_rack` muestra de 1 a 4 GPUs según `state.gpus`; `whiteboard` cambia su texto con la fase; `founder` tiene `idle`, `typing` y `panic` (cuando falla un entrenamiento); `servers` echa humo cuando la loss se dispara.
- Animaciones sencillas por frames (2–4 por sprite, 4–8 fps): LEDs que parpadean, personaje que teclea. Hay que respetar `prefers-reduced-motion`.
- La escena se **cuelga del estado y no lo modifica**: es solo visual. Opcionalmente, un clic en un hueco puede abrir su panel (p. ej. clic en el rack → panel Computación).

### 14.2 Archivos

```
src/scene/
  scenes.ts          # definición de cada escena: slots, posiciones, capas
  variants.ts        # funciones estado → variante de cada slot
  SceneView.tsx      # renderiza la escena (canvas o SVG)
  placeholders.ts    # dibujo de rectángulos de cada slot
public/assets/
  manifest.json      # qué sprites existen
  sprites/           # PNG, uno por sprite o hojas de sprites
```

### 14.3 Formato del manifiesto

Este formato es el **contrato** con el futuro generador de assets (§15): el generador escribirá en él y el juego lo leerá.

```json
{
  "version": 1,
  "palette": "ownai-32",
  "sprites": {
    "gpu_rack.2": {
      "file": "sprites/gpu_rack_2.png",
      "w": 46, "h": 62,
      "anchor": "bottom-left",
      "frames": 2, "fps": 4
    }
  }
}
```

- Nombre del sprite = `<slot>.<variante>`. Si no hay variante, solo `<slot>`.
- Medidas en píxeles lógicos (escala 1). PNG con transparencia y sin antialiasing.
- Si hay `frames` > 1, la hoja se dispone en horizontal y cada frame mide `w` × `h`.
- **Paleta común** en `src/scene/palette.ts`, de unos 32 colores, sacada de la maqueta (ámbar `#F5A623`, teal `#5fd3bc`, violetas oscuros de fondo, pasteles de la oficina). Todos los sprites deben usarla.

### 14.4 En los hitos

- **Hito 1**: escena `garage` solo con placeholders, más el sistema de slots, variantes y manifiesto (vacío).
- **Hito 3**: escena `office`.
- **Hito 4**: escenas `campus` y `ending`.
- Test: un manifiesto con un sprite ficticio se carga y sustituye su placeholder; un sprite que falta no rompe nada.

## 15. Futuro: generador de assets propio (no implementar ahora)

Lo más probable es que los assets los generemos nosotros con una herramienta propia. Este prototipo **no** la incluye, pero el manifiesto (§14.3) y la paleta están pensados para ella. Idea de partida:

1. Lee `manifest.json` y `scenes.ts` para saber qué slots y variantes faltan y de qué tamaño son.
2. Genera cada sprite a partir de un prompt base con el estilo común más la descripción del slot. Puede ser en local (RTX 5070, modelo de imagen con un LoRA de pixel art) o con una API de generación de imágenes.
3. Postproceso automático: reduce a la resolución lógica del slot, cuantiza a la paleta `ownai-32`, elimina el fondo, quita los píxeles sueltos y monta las hojas de frames.
4. Interfaz para revisar: ver los sprites en la escena real, regenerar o retocar uno, y aprobarlo.
5. Escribe el PNG en `public/assets/sprites/` y actualiza `manifest.json`.

Cuando toque, tendrá su propia spec. Hasta entonces, solo hay que respetar el contrato del manifiesto.

## 16. Fuera del alcance de este prototipo

Sprites y arte definitivo (solo placeholders), el generador de assets, sonido, animaciones elaboradas, logros, traducción al inglés, Capacitor o tiendas de apps, analítica y backend.
