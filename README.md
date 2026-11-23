# OwnAI

*Build your own AI empire and get rich with hype.* Juego incremental web, sátira de las startups de IA. Spec en [`docs/OWNAI_SPEC.md`](docs/OWNAI_SPEC.md).

## Comandos

```
npm install
npm run dev        # juego en http://localhost:5173 (añade ?debug=1 para el panel de debug)
npm run build      # tsc + build de producción
npm test           # tests (Vitest)
npm run sim        # simulación de balance: 20 partidas con el bot (npm run sim -- 40 para más)
```

Depuración del balance: `npx tsx src/sim/trace.ts <semilla> [cada_s] [max_min] [--log]` y `npx tsx src/sim/inspect.ts <semilla> <minuto>`.

## Estructura

- `src/engine/`: motor en TypeScript puro, sin React. `balance.ts` tiene todos los números; `tick.ts` avanza el estado; `actions.ts` aplica las acciones del jugador; `phases/` tiene un módulo por fase.
- `src/content/`: todos los textos del juego.
- `src/scene/`: escena en pixel art con huecos (slots) y placeholders. Los sprites se declaran en `public/assets/manifest.json`, con el nombre `<slot>.<variante>`, y sustituyen al placeholder sin tocar código.
- `src/ui/`: componentes React. Solo pintan el estado y lanzan acciones.
- `src/sim/`: bot y simulador headless.

Los cambios de balance respecto a la spec están en [`BALANCE_NOTES.md`](BALANCE_NOTES.md).
