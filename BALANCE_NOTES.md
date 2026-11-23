# Notas de balance

Cambios respecto a la spec (`docs/OWNAI_SPEC.md`). Todos los valores viven en `src/engine/balance.ts`.

## Hito 1 · Fase 0

- **Reputación por prompt respondido** (`PROMPT_ANSWER_REP = 0,15`): la spec dice que la reputación baja al caducar un prompt y que sube la tasa de llegada, pero no dice cómo sube. Sin esto la tasa de llegada nunca cambia.
- **Salida de personal por impago** (`UNPAID_LEAVE_SECONDS = 5`): en Fases 0–1 el dinero no baja de 0; si no llega para sueldos, se va alguien cada 5 s de impago (primero GPUs alquiladas, luego investigadores, luego anotadores).
- **Ingresos/s** en la barra: media móvil de 5 s de todo lo que entra de forma recurrente (`INCOME_EMA_SECONDS`).
