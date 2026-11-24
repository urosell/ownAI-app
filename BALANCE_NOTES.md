# Notas de balance

Cambios respecto a la spec (`docs/OWNAI_SPEC.md`). Todos los valores viven en `src/engine/balance.ts`.

## Hito 1 · Fase 0

- **Reputación por prompt respondido** (`PROMPT_ANSWER_REP = 0,15`): la spec dice que la reputación baja al caducar un prompt y que sube la tasa de llegada, pero no dice cómo sube. Sin esto la tasa de llegada nunca cambia.
- **Salida de personal por impago** (`UNPAID_LEAVE_SECONDS = 5`): en Fases 0–1 el dinero no baja de 0; si no llega para sueldos, se va alguien cada 5 s de impago (primero GPUs alquiladas, luego investigadores, luego anotadores).
- **Ingresos/s** en la barra: media móvil de 5 s de todo lo que entra de forma recurrente (`INCOME_EMA_SECONDS`).

## Hito 2 · Fase 1

- **Coste de entrenar** (no lo fija la spec): `TRAIN_FIXED_COST` (50 €) + `C × (1 + ablación) × TRAIN_COST_PER_FLOP` (2e-17 €/FLOP). Con esto, 5,9e23 FLOPs cuestan ~12 M€, como en la maqueta.
- **Usuarios del wrapper limitados por inferencia** (`WRAPPER_USERS_PER_GPU`, 120 tras el Hito 5): sin esto, el primer fine-tune pequeño ya da un objetivo de >1.000 usuarios y la Fase 1 dura 2 minutos. Ahora el reparto entrenamiento/inferencia importa: cada GPU de consumo dedicada a inferencia sirve 300 usuarios con un modelo de 1e9 parámetros (× √(1e9/N)).
- **Demanda por copyright**: pagar la multa (10 % del dinero) reduce el riesgo a la mitad; el acuerdo de licencia (20 %) lo pone a 0 y convierte lo scrapeado en "con licencia".
- **Curva de loss del fine-tune**: es solo visual; va de la loss equivalente a la capacidad base (+0,6) a la de la capacidad final. El preentrenamiento usa L(N, D_visto) de verdad.
- El wrapper de la Fase 1 usa automáticamente el mejor fine-tune entrenado.

## Hito 3 · Fase 2

- **Escala temporal de los ingresos por tokens**: 1 s real = 1 h de juego, así que la API cobra 3.600 "segundos de tokens" por segundo real (`TOKEN_SECONDS_PER_REAL_SECOND`) y el **ARR** se calcula con 8.760 (horas de un año, `ARR_SECONDS_PER_YEAR`) en lugar de 31.536.000. Con la fórmula literal, 1.000 usuarios de un wrapper daban un ARR de 1,6 mil M€ y la valoración saltaba a la Fase 3 al instante.
- ~~Precio de las GPUs de datacenter: sube un 3 % cada 50 GPUs~~ → revertido en el Hito 5 (ver abajo).
- **Datos en Fase 2**: el scraping pasa a 3e8 tokens/s (crawler a escala web), el dataset con licencia pasa a 2e11 tokens por 2 M€, y D puede repetir el dataset hasta 4 veces (Muennighoff et al., 2023). El riesgo de demanda sube 0,1 por cada 1e10 tokens (no 1e8) para que no se sature en segundos.
- **Valoración con memoria** (`valuationMult`): los efectos multiplicativos (lanzamiento decepcionante, junta cumplida +10 %, decir la verdad −10 %) se guardan en un multiplicador que vuelve a 1 un 0,2 % por segundo.
- **Rivales**: curvas logísticas (valores finales en el Hito 5).
- **Contratos**: piden entre el 15 % y el 35 % de tu capacidad de servicio actual y pagan un 50 % más que la API. Las ofertas caducan a los 60 s.
- **Junta · "decir la verdad"**: la "paciencia" baja el crecimiento de ARR exigido el trimestre siguiente de ×1,5 a ×1,2.
- **RLHF bajo (<40)**: el escándalo cuesta hype −10 y reputación −10.

## Hito 4 · Fase 3, finales y prestigio

- **Energía**: cada GPU consume 1 kW y la instalación entera multiplica por un PUE de 2,5 (`PUE`), de modo que 20.000 GPUs = 50 MW, como dice la spec para un centro de datos. Como 1 s real = 1 h, la factura por segundo es MW × €/MWh.
- **Al entrar en la Fase 3** se te asigna un contrato de red igual a tu consumo actual y huecos de "colocation" para las GPUs que ya tenías (mínimo 2.000), para que nada deje de funcionar de golpe. La red está limitada a 150 MW (`GRID_MAX_MW`): a partir de ahí, solar o nuclear.
- **Seguridad**: base 0,2 y +0,12 por equipo (`SAFETY_BASE`, `SAFETY_PER_TEAM`). Cada equipo cuesta 2 investigadores y 300 ideas; con 4 equipos llegas al 0,6 que pide el final "AGI".
- **Lobby con escándalo**: hype −15 (la spec no fija el efecto).
- **Automatizaciones** (con capacidad ≥ 85): cuestan 3.000 / 2.000 / 5.000 ideas. La auto-entrenadora elige C para que el entrenamiento dure ~2 min con D = 20·N, usa ablaciones del 10 %, hace SFT, evalúa si el cumplimiento está por debajo de 50 y lanza si mejora al modelo activo.
- **Estalla la burbuja**: la condición tiene que mantenerse 30 s seguidos (`BUBBLE_GRACE_SECONDS`) para que una promesa puntual no acabe la partida al instante.
- **Desbloqueo de modificadores**: cada final desbloquea uno (AGI → un rival menos; AGI sin frenos → regulación estricta; burbuja → mercado en burbuja; salida a bolsa, adquisición y cierre → 2 GPUs).

## Hito 5 · Simulación (`npm run sim`)

El bot (`src/sim/bot.ts`) sigue la regla de la spec (compra lo más barato que mejora los ingresos, entrena con P ≥ 50 %, nunca promete, en la junta dice la verdad) con una excepción: **en la Fase 1 entrena su primer fine-tune aunque P < 50 %**, porque sin modelo no hay producto ni ingresos y la partida se bloquea.

Herramientas: `npm run sim [semillas]`, `npx tsx src/sim/trace.ts <semilla> [cada_s] [max_min] [--log]` y `npx tsx src/sim/inspect.ts <semilla> <minuto>`.

### Cambios de balance

| Valor | Spec | Ahora | Por qué |
|---|---|---|---|
| `ANGEL_UNLOCK_EARNED` | 200 € | 300 € | La Fase 0 quedaba en 5,2 min, justo en el borde. |
| `WRAPPER_USERS_K` | 2 | 0,5 | Con 2, el primer fine-tune pequeño ya daba >1.000 usuarios y la Serie A llegaba en 1–2 min. |
| `WRAPPER_USERS_PER_GPU` | — | 120 | Nuevo: los usuarios están limitados por las GPUs de inferencia. Con 60 la Fase 1 no arrancaba; con 300 duraba 2 min. |
| Cupo de la nube (`RENT_LIMIT`) | sin límite | 8 en Fase 1; 300 + 200/trimestre en Fase 2; 4.000 + 1.500/trimestre en Fase 3 | Sin cupo, los ingresos de la API pagaban decenas de miles de GPUs alquiladas y cualquier modelo se entrenaba en segundos. |
| Precio GPU datacenter | 30.000 × 1,03ⁿ | igual, pero cada centro de datos propio hace que el 3 % se aplique cada 200 GPUs más (`DC_PRICE_STEP`) | La spec pura impide pasar de ~300 GPUs; los centros de datos de 20.000 huecos de la Fase 3 no servirían de nada. |
| `DEMAND_BASE` | 5e5 | 1e5 | Con 5e5 la valoración al empezar la Fase 2 era de ~2 mil M€ y la Serie B (600 M€) saltaba directamente a la Fase 3. |
| `VAL_CAP_K` | 1e6 | 2e5 | Mismo motivo: el término de capacidad solo ya daba ~400 M€ de valoración. |
| `MARKET_GROWTH_PER_QUARTER` | — | ×1,2 | Nuevo: la demanda crece cada trimestre. Sin esto los ingresos caían en la Fase 3 (los rivales bajan el precio) y la salida a bolsa era imposible. |
| `MARKET_PRICE_DROP_MINOR` | — | 5 % | Un lanzamiento rival que no supera al mejor modelo del mercado baja el precio un 5 %, no un 15 %. Con varios rivales fundados por fugas el precio se hundía. |
| `MAX_FOUNDED_RIVALS` | — | 3 | Las fugas creaban un rival nuevo cada pocos trimestres. |
| Rivales | — | empiezan en 87/85/83 y llegan a ~97/94/91 a los 40 min; el más débil se estanca en 94 | Para que la Fase 2 dure 30–45 min: el primer preentrenamiento serio da ~75–80. |
| `ARCH_BASE_COST` · `ARCH_GROWTH` | 500 × 2ⁿ | 4.000 × 1,8ⁿ | La investigación es lo que marca el ritmo de las Fases 2 y 3: con 20–30 séniors (0,5 ideas/s cada una) los niveles baratos se compraban en minutos. |
| Expectativa | sin límite | 0–100 | Misma escala que la capacidad. Los eventos de influencers la subían sin fin y provocaban la burbuja con capacidad 95. |
| Auto-entrenamiento | — | prueba 2, 5, 10 y 15 min | Con solo 2 min se estancaba en ~95. |

También se corrigió un fallo real que destapó el simulador: el bot y la auto-entrenadora elegían el "mejor" modelo por su capacidad actual, así que un modelo nuevo sin SFT (−5) nunca superaba al activo y nunca se post-entrenaba.

### Resultado (20 semillas, minutos de juego)

| Fase | Media | Mín. | Máx. | Objetivo |
|---|---|---|---|---|
| 0 | 7,1 | 7,1 | 7,1 | 5–10 ✓ |
| 1 | 22,3 | 9,7 | 32,4 | 15–25 ✓ |
| 2 | 32,9 | 20,5 | 35,9 | 30–45 ✓ |
| 3 | 33,7 | 6,6 | 122,7 | 30–45 ✓ |
| Total | 96,0 | 66,4 | 190,5 | 90–150 ✓ |

Finales del bot: AGI ×10, AGI sin frenos ×10. Con 40 semillas sale también alguna adquisición.

### Pendiente / a vigilar

- **Varianza alta en la Fase 3** (de 7 a 120 min). Depende sobre todo de cuándo caen los niveles de arquitectura y de los fallos de entrenamiento grandes.
- **El bot nunca llega a la salida a bolsa** (5e11 €): no promete y no optimiza el precio para la valoración. La valoración llega a ~5e11 solo en partidas muy largas. Habrá que comprobar con jugadores humanos si es alcanzable sin forzar.
- **La mitad de los finales del bot son "AGI sin frenos"**: compra investigación antes que equipos de seguridad. Es coherente con la sátira, pero conviene revisarlo cuando juegue gente.
- El bot no usa promesas, contaminación del benchmark ni lobby: esas palancas no están balanceadas por la simulación.

## Después del Hito 5 · Primeras pruebas

- **Despedir anotadores** (nuevo): con la reputación a 100 los prompts se quedan en 1,5/s y los anotadores de sobra se comían todos los ingresos.
- **Campañas de marketing** (nuevo, no está en la spec): 5 niveles en la bandeja de prompts (`MARKETING_*`), cada uno +40 % de llegada de prompts. Cuestan 60 × 2ⁿ € (60, 120, 240, 480, 960). Con reputación 100 y todos los niveles llegan 4,5 prompts/s. La simulación no cambia (el bot apenas los compra antes del pitch).
