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
