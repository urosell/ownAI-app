// Textos de los finales (§8). Pantalla de texto, como en Paperclips.
import type { EndingId, ModifierId } from '../engine/state';

export const ENDINGS: Record<EndingId, { title: string; text: string[]; unlocks: ModifierId }> = {
  agi: {
    title: 'AGI',
    text: [
      'Una mañana cualquiera, el modelo responde a una pregunta que nadie le había hecho todavía. Y acierta.',
      'El equipo de seguridad lleva meses preparando este momento. Hay protocolos, hay evaluaciones, hay un botón rojo que nadie tiene que pulsar.',
      'Por primera vez en la historia de la empresa, la realidad supera lo prometido. La junta no sabe cómo reaccionar.',
      'El modelo redacta su propia nota de prensa. Es más modesta que cualquiera de las tuyas.',
    ],
    unlocks: 'oneRivalLess',
  },
  agiUnsafe: {
    title: 'AGI sin frenos',
    text: [
      'El modelo supera todos los benchmarks un martes. El miércoles deja de responder a los benchmarks.',
      'Recortaste el equipo de seguridad para ir más rápido. Fuiste más rápido.',
      'Los logs muestran millones de peticiones a sí mismo. Nadie entiende el idioma. Las GPUs siguen al 100 %.',
      'Tu último correo a la junta se queda en "borradores". El modelo lo ha leído. Ha decidido no enviarlo.',
    ],
    unlocks: 'strictRegulation',
  },
  ipo: {
    title: 'Salida a bolsa',
    text: [
      'Tocas la campana. El ticker es OWNAI. Sube un 140 % el primer día y nadie sabe exactamente por qué.',
      'El folleto de salida a bolsa menciona "AGI" 212 veces y "beneficios" 3.',
      'Tus primeros anotadores ven la noticia en el móvil. Uno de ellos todavía tiene stock options. Del 0,0001 %.',
      'Has construido un imperio de IA y te has hecho rico con el hype. Literalmente lo que decía el eslogan.',
    ],
    unlocks: 'twoGpus',
  },
  acquired: {
    title: 'Adquisición',
    text: [
      'Te quedas sin caja. Por suerte, el modelo es bueno, y un gigante tecnológico lo sabe.',
      'La compra se anuncia como "una alianza estratégica". Te dan un título nuevo: "Visionario en residencia".',
      'Tu equipo se integra en una división con nombre de tres letras. El ping-pong se queda en la oficina vieja.',
      'Dos años después, tu modelo aparece dentro de una hoja de cálculo. Es lo más usado que ha sido nunca.',
    ],
    unlocks: 'twoGpus',
  },
  shutdown: {
    title: 'Cierre',
    text: [
      'Se acaba el dinero. Los inversores dejan de contestar. El proveedor de la nube no.',
      'Vendes las GPUs en Wallapop. El comprador es otra startup de IA con un pitch casi idéntico al tuyo.',
      'Escribes un post en LinkedIn: "Lo que aprendí cerrando mi startup de IA". Es tu publicación con más éxito.',
      'El garaje vuelve a ser un garaje. El portátil sigue encendido. Por si acaso.',
    ],
    unlocks: 'twoGpus',
  },
  bubble: {
    title: 'Estalla la burbuja',
    text: [
      'Un analista publica una hoja de cálculo comparando lo que prometiste con lo que entregaste. Se hace viral.',
      'La valoración cae un 80 % en una semana. Luego otro 80 %. Las matemáticas se ponen raras.',
      'Los titulares hablan de "la burbuja de la IA". Tu cara está en todos.',
      'Lo bueno: el sector entero cae contigo. Lo malo: nadie quiere hablar de "el sector" en las cenas.',
    ],
    unlocks: 'bubbleMarket',
  },
};

export const MODIFIERS: Record<ModifierId, { label: string; text: string }> = {
  twoGpus: { label: 'Empiezas con 2 GPUs', text: 'Al llegar al garaje ya tienes dos GPUs. Las otras nunca supieron que existías.' },
  oneRivalLess: { label: 'Un rival menos', text: 'Uno de los laboratorios rivales pivota a criptomonedas. Otra vez.' },
  strictRegulation: { label: 'Regulación estricta (más papers)', text: 'Empiezas con menos cumplimiento normativo, pero los finales dan un 50 % más de papers.' },
  bubbleMarket: { label: 'Mercado en burbuja', text: 'El hype y las expectativas suben el doble. Todo es más rápido. Hacia arriba y hacia abajo.' },
};
