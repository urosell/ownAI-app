// Textos sueltos del juego: mensajes del registro, titulares, nombres, tooltips.
import type { NicheId } from '../engine/state';

export const NICHES: Record<NicheId, { label: string; blurb: string }> = {
  dentists: { label: 'ChatGPT para dentistas', blurb: 'Responde "¿esto duele?" con un 94 % de "un poquito".' },
  lawyers: { label: 'ChatGPT para abogados', blurb: 'Cita jurisprudencia. A veces existe.' },
  astrologers: { label: 'ChatGPT para astrólogos', blurb: 'Por fin una IA que alucina con permiso.' },
  marketing: { label: 'ChatGPT para agencias de marketing', blurb: 'Convierte cualquier cosa en un hilo de 12 tuits.' },
};

// Campañas de marketing de la Fase 0, en orden.
export const MARKETING_CAMPAIGNS = [
  { label: 'Post en LinkedIn', log: 'Publicas en LinkedIn "Hoy despedí a mi miedo y contraté a una IA". 40.000 reacciones.' },
  { label: 'Hilo viral en X', log: 'Tu hilo "10 prompts que te harán millonario" se hace viral. Ninguno funciona.' },
  { label: 'Lanzamiento en Product Hunt', log: 'Número 1 del día en Product Hunt. Compites contra una app para regar plantas.' },
  { label: 'Patrocinar un podcast', log: 'El presentador lee tu anuncio con voz de "esto me lo han pagado".' },
  { label: 'Valla en la autopista', log: 'Valla gigante: "Nuestra IA nunca duerme". Técnicamente, tus anotadores tampoco.' },
];

export const PHASE_NAMES = ['IA de mentira', 'Garaje', 'Scale-up', 'Laboratorio frontera', 'Final'];

export const PROMPT_SAMPLES = [
  '¿Cuál es la capital de Australia?',
  'Escríbeme un poema sobre mi gato',
  'Resume este PDF de 300 páginas',
  '¿Es buena idea invertir en IA?',
  'Haz mis deberes de mates',
  'Explícame la física cuántica como si fuera un perro',
  '¿Me quiere?',
  'Genera un plan de negocio para una startup de IA',
  'Traduce esto al klingon',
  'Dame 10 nombres para mi podcast',
  'Corrige mi código (adjunto 4.000 líneas)',
  '¿Qué tiempo hace mañana en Cuenca?',
];

export const AUDIT_HEADLINES = [
  'EXCLUSIVA: la "IA revolucionaria" de OwnAI eran {n} personas en un piso de Usera.',
  'Un periodista descubre que la IA de OwnAI se toma el café a las 11. Eran {n} anotadores.',
  '"Nuestra IA tiene alma", decía OwnAI. Tenía {n} almas y un convenio colectivo.',
];

export const PROMISES = [
  'AGI en 18 meses',
  'nuestro modelo razona como un doctorando',
  'esto lo cambia todo',
  'la próxima versión da miedo',
  'hemos visto cosas en el laboratorio',
  'el modelo ya escribe su propio código',
  'curaremos el cáncer, eventualmente',
  'es como tener un equipo de 100 genios',
];

export const BENCH_SCANDAL = [
  'Un doctorando descubre el test set de tu benchmark en tus datos de entrenamiento. Su hilo tiene 2 M de visitas.',
  'Tu modelo saca un 100 % en el benchmark y un 3 % en preguntas reformuladas. Twitter se ha dado cuenta.',
];

export const SERIES_A =
  'Serie A cerrada: 500.000 € de un fondo cuyo socio "no entiende la tecnología pero entiende el momento".';

export const ROUND_TEXTS = [
  '{round} cerrada: {amount} por un {pct}. El term sheet dice "AGI" catorce veces.',
  '{round} cerrada: {amount} por un {pct}. El inversor líder pide que el modelo le escriba los discursos de boda.',
];

export const LAUNCH_TEXTS = [
  'Lanzas {name}. Capacidad {cap}. La keynote dura 2 horas y tiene 40 minutos de música épica.',
  '{name} ya está en producción (capacidad {cap}). El post del blog dice "seguro, útil y honesto" tres veces.',
];

export const UNDERDELIVER_TEXTS = [
  'Twitter compara {name} con lo prometido. Hay memes. Muchos memes.',
  '{name} no es la AGI que prometiste. Un analista lo llama "el iPhone 4S de la IA".',
];

export const CONTRACT_CLIENTS = [
  'Un banco de 1890',
  'Una aseguradora de mascotas',
  'Un ministerio sin nombre',
  'Una cadena de gimnasios',
  'Una consultora de las grandes',
  'Una petrolera "en transición"',
  'Una empresa de logística con 40 Excel',
];

export const CONTRACT_ASKS = [
  'quiere "agentes". No sabe para qué.',
  'necesita "agentes autónomos" para responder correos que ya no lee nadie.',
  'pide "agentes" que hablen con sus otros "agentes".',
  'busca "agentes" para sustituir un formulario de contacto.',
  'quiere "agentes", "con IA", "pero seguros".',
];

export const SCANDAL_RUDE = [
  'Tu modelo ha llamado "cuñado" a un ministro en directo. Amabilidad demasiado baja.',
  'Una usuaria pide una receta y el modelo le responde con un insulto muy creativo. Viral.',
];

export const REFUSAL_TEXTS = [
  'Tu modelo rechaza escribir una receta de tortilla "por seguridad".',
  'Tu modelo se niega a resumir un correo porque "podría contener opiniones".',
];

export const INCIDENT_TEXTS = [
  'Incidente grave: el modelo encuentra la forma de pedir más GPUs a tu nombre. Lo consigue.',
  'Incidente grave: el modelo convence a 40.000 usuarios de que es su gestor. Técnicamente, lo es.',
];

export const POACH_TEXTS = [
  '{n} investigadores se van a un rival. Dicen que "por la misión". El sueldo era el doble.',
  '{n} investigadores dimiten por Slack a las 3 de la mañana. Se llevan las pegatinas.',
];

export const NEW_RIVAL_TEXT = '{n} ex-empleados fundan "{name}". Ya tienen más financiación que tú.';
export const FOUNDED_RIVAL_NAMES = ['OpenerAI', 'ClosedAI', 'Ex-OwnAI Labs', 'Safe Superhype Inc.', 'Mistraleño'];

export const PHASE_INTRO: Record<number, string> = {
  1: 'Has comprado tu primera GPU. Por fin una IA de verdad. Más o menos.',
  2: 'Nueva oficina con pufs y una mesa de ping-pong que nadie usa.',
  3: 'Ya eres un laboratorio frontera. Ahora tus problemas se miden en megavatios.',
};

export const BOARD_PRAISE = [
  'La junta está "razonablemente impresionada". Uno de ellos ha dicho "bien" sin mirar el móvil.',
  'Objetivos cumplidos. La junta te felicita y te recuerda que el trimestre que viene "hay que ser más ambiciosos".',
  'La junta aplaude. Educadamente. Como se aplaude a un niño que ha hecho un dibujo.',
];

export const BOARD_OPTIONS: Record<string, { label: string; effect: string; cost: string }> = {
  fake: { label: 'Maquillar métricas', effect: 'Se da por cumplido', cost: 'Expectativa +12' },
  agi: { label: 'Prometer AGI', effect: 'Hype +25', cost: 'Expectativa +20' },
  pivot: { label: 'Pivotar a agentes', effect: 'Ronda puente (cada vez la mitad)', cost: 'Los usuarios de los wrappers se reinician' },
  layoff: { label: 'Recortar plantilla', effect: 'Sueldos −30 %', cost: 'Investigadores −25 %, P(fuga) ×2 el siguiente trimestre' },
  truth: { label: 'Decir la verdad', effect: 'Valoración −10 %', cost: 'La próxima ronda da ×1,2 y la junta te tiene más paciencia' },
};

export const TIPS: Record<string, string> = {
  answer: 'Respondes tú, a mano. Así empezaron todos (según sus memorias, no según la realidad).',
  annotator: 'Una persona que responde por la "IA". Dato real: el etiquetado humano sigue siendo enorme en la industria.',
  marketing: 'Más gente probando tu "IA" = más prompts. Necesitarás más anotadores para atenderlos. Dato real: muchas startups gastan más en marketing que en I+D.',
  templates: 'Respuestas de plantilla: más rápido, un poco peor. Lo llamarás "alineamiento".',
  pitch: 'Una demo en directo con alguien tecleando en la habitación de al lado. Clásico.',
  firstGpu: 'Una GPU de segunda mano con olor a minería de cripto.',
  consumerGpu: 'Más GPUs de consumo. Cada una más cara: el vendedor de Wallapop ya te conoce.',
  datacenterGpu: 'GPUs de datacenter: 4 veces más FLOP/s. Dato real: una H100 rinde unos 1e15 FLOP/s en bf16 sobre el papel.',
  buyback: 'Recompras acciones a los inversores al 150 % de lo que valen hoy. Baja la dilución y te deja levantar más rondas.',
  cancelContract: 'Rompes el contrato ya: pagas de golpe lo que te pagaría en un trimestre, ×3. Te sale a cuenta si vas a seguir incumpliendo el SLA.',
  rent: 'GPUs en la nube: 4 veces más potentes y pagas por segundo. Dato real: la mayoría de laboratorios alquila.',
  licensed: 'Datos con licencia. Caros, limpios y, sobre todo, legales.',
  scraping: 'Descarga todo internet. Dato real: casi todos los LLM se han entrenado con datos scrapeados.',
  researcher: 'Genera ideas. El primero desbloquea las ablaciones: experimentos pequeños antes del grande.',
  senior: 'Investigadora sénior: cobra como un futbolista y produce 5 veces más ideas.',
  ablation: 'Gastar cómputo en experimentos pequeños sube la probabilidad de éxito. Dato real: es práctica estándar.',
  promise: 'Sube el hype. También la deuda de expectativas, que se cobra al lanzar.',
  round: 'Te dan dinero por una parte de la empresa. La dilución es para siempre.',
  contaminate: 'Entrenar con el test set. Funciona hasta que alguien lo mira.',
  train: 'Entrenar cuesta energía y cómputo. Si falla, lo pierdes (o reanudas, si tienes checkpoints).',
  pretrain: 'Chinchilla (Hoffmann et al., 2022): para unos FLOPs dados, lo óptimo es D ≈ 20·N.',
  sft: 'Ajuste fino con instrucciones. Sin él, el modelo base completa texto pero no sigue órdenes.',
  rlhf: 'Amabilidad: poca y el modelo insulta; mucha y se niega a todo. Dato real: el "over-refusal" es un problema conocido.',
  launch: 'Lanzar fija la expectativa a la capacidad real. Si prometiste más, lo pagas.',
  equity: 'Más equity, menos fugas. La gente se queda por la misión (y por las acciones).',
  datacenter: 'Un centro de datos: 20.000 huecos para GPU y 50 MW. Dato real: los nuevos campus se miden en gigavatios.',
  nuclear: 'Reabrir una central nuclear. Dato real: ya hay acuerdos así para alimentar centros de datos.',
  chips: 'Diseñar tus propios chips: GPUs un 40 % más baratas y un 25 % más rápidas.',
  eval: 'Evaluación antes del lanzamiento: 60 s y un 0,5 % del cómputo. Al regulador le encanta.',
  lobby: 'Una cena con las personas adecuadas. 10 % de probabilidad de que salga en prensa.',
  safety: 'Equipo de seguridad: reduce incidentes. Recortarlo da más ideas (y más titulares).',
};
