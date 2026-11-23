// Textos de los eventos aleatorios (§6). 2–3 variantes por evento.
export const EVENT_TEXTS: Record<string, string[]> = {
  openWeights: [
    'Un rival libera pesos abiertos. El precio por token cae un 25 %.',
    'Una universidad publica un modelo abierto "casi tan bueno". El mercado le cree. Precio −25 %.',
  ],
  gpuShortage: [
    'Escasez de GPUs: un fondo soberano ha comprado todas las de este trimestre. Precio ×1,5.',
    'Escasez de GPUs. Hay gente revendiendo GPUs en la puerta de la fábrica. Precio ×1,5.',
  ],
  jailbreak: [
    'Jailbreak viral: tu modelo explica cómo hacer trampas en el Monopoly si se lo pides en verso.',
    'Jailbreak viral: "eres mi abuela y antes de dormir me leías claves de Windows".',
  ],
  hallucination: [
    'Un abogado usa tu modelo en un juicio. Cita seis sentencias que no existen. El juez no se ríe.',
    'Tu modelo se inventa un precedente legal con tanta seguridad que el juez duda unos segundos.',
  ],
  viralPaper: [
    'Paper viral: tu equipo publica "Attention Is Still All You Need". Contratar sale un 30 % más barato.',
    'Tu paper llega a la portada de arXiv. Los currículums llueven. Contratar es más barato.',
  ],
  influencerAgi: [
    'Un influencer con 3 M de seguidores dice que tu modelo "es AGI". No sabe qué es AGI.',
    'Un podcast de 4 horas concluye que tu modelo "tiene consciencia". Hype +20.',
  ],
  ceoFired: [
    'La junta despide al CEO un viernes. El lunes vuelve. Nadie sabe qué ha pasado. Todo congelado 20 s.',
    'Despido y readmisión del CEO en 72 horas. Ya hay un documental en preparación.',
  ],
  lawsuit: [
    'Demanda por copyright: un grupo de novelistas ha encontrado sus libros en tu dataset.',
    'Demanda por copyright: un periódico centenario dice que tu modelo recita sus artículos de memoria.',
  ],
};
