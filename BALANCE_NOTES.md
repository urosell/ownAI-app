# Notas de balance

Cambios respecto a la spec (`docs/OWNAI_SPEC.md`). Todos los valores viven en `src/engine/balance.ts`.

## Hito 1 · Fase 0

- **Reputación por prompt respondido** (`PROMPT_ANSWER_REP = 0,15`): la spec dice que la reputación baja al caducar un prompt y que sube la tasa de llegada, pero no dice cómo sube. Sin esto la tasa de llegada nunca cambia.
- **Salida de personal por impago** (`UNPAID_LEAVE_SECONDS = 5`): en Fases 0–1 el dinero no baja de 0; si no llega para sueldos, se va alguien cada 5 s de impago (primero GPUs alquiladas, luego investigadores, luego anotadores).
- **Ingresos/s** en la barra: media móvil de 5 s de todo lo que entra de forma recurrente (`INCOME_EMA_SECONDS`).

## Hito 2 · Fase 1

- **Coste de entrenar** (no lo fija la spec): `TRAIN_FIXED_COST` (50 €) + `C × (1 + ablación) × TRAIN_COST_PER_FLOP` (2e-17 €/FLOP). Con esto, 5,9e23 FLOPs cuestan ~12 M€, como en la maqueta.
- **Usuarios del wrapper limitados por inferencia** (`WRAPPER_USERS_PER_GPU = 300`): sin esto, el primer fine-tune pequeño ya da un objetivo de >1.000 usuarios y la Fase 1 dura 2 minutos. Ahora el reparto entrenamiento/inferencia importa: cada GPU de consumo dedicada a inferencia sirve 300 usuarios con un modelo de 1e9 parámetros (× √(1e9/N)).
- **Demanda por copyright**: pagar la multa (10 % del dinero) reduce el riesgo a la mitad; el acuerdo de licencia (20 %) lo pone a 0 y convierte lo scrapeado en "con licencia".
- **Curva de loss del fine-tune**: es solo visual; va de la loss equivalente a la capacidad base (+0,6) a la de la capacidad final. El preentrenamiento usa L(N, D_visto) de verdad.
- El wrapper de la Fase 1 usa automáticamente el mejor fine-tune entrenado.

## Hito 3 · Fase 2

- **Escala temporal de los ingresos por tokens**: 1 s real = 1 h de juego, así que la API cobra 3.600 "segundos de tokens" por segundo real (`TOKEN_SECONDS_PER_REAL_SECOND`) y el **ARR** se calcula con 8.760 (horas de un año, `ARR_SECONDS_PER_YEAR`) en lugar de 31.536.000. Con la fórmula literal, 1.000 usuarios de un wrapper daban un ARR de 1,6 mil M€ y la valoración saltaba a la Fase 3 al instante.
- **Precio de las GPUs de datacenter**: sube un 3 % cada 50 GPUs (`growthStep`), no cada GPU. Con 1,03ⁿ por unidad, más de ~300 GPUs eran imposibles y un preentrenamiento como el de la maqueta (5,9e23 FLOPs en 41 s) necesita ~10.000.
- **Datos en Fase 2**: el scraping pasa a 3e8 tokens/s (crawler a escala web), el dataset con licencia pasa a 2e11 tokens por 2 M€, y D puede repetir el dataset hasta 4 veces (Muennighoff et al., 2023). El riesgo de demanda sube 0,1 por cada 1e10 tokens (no 1e8) para que no se sature en segundos.
- **Valoración con memoria** (`valuationMult`): los efectos multiplicativos (lanzamiento decepcionante, junta cumplida +10 %, decir la verdad −10 %) se guardan en un multiplicador que vuelve a 1 un 0,2 % por segundo.
- **Rivales**: curvas logísticas ajustadas para empezar en 70/66/62 de capacidad (por encima del mejor fine-tune posible, ~60) y llegar a ~91/88/84 a los 40 min. Si no, el fine-tune de la Fase 1 ya entraba en el top 3 y la Fase 2 duraba 0 s.
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
