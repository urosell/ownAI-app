// Ayudas al pasar el ratón por las etiquetas de los paneles (clave = texto de la etiqueta).
export const HELP: Record<string, string> = {
  // Fase 0
  Llegan: 'Prompts nuevos por segundo. Suben con la reputación (hasta ×3 a 100), con el marketing y bajando el precio.',
  'Reputación por prompt': 'Reputación que ganas por cada prompt respondido. A 1 € son +0,15; a 2 € nada; por encima de 2 € la pierdes.',
  Reputación: 'De 0 a 100. Hace que lleguen más prompts y, en la Fase 1, multiplica los usuarios de tu producto (×2 a 100). Baja si caducan prompts o te pillan.',
  'Calidad de respuesta': 'Multiplica lo que cobras por prompt. Las plantillas la bajan a 0,9 a cambio de un 50 % más de velocidad.',
  Anotadores: 'Personas que responden los prompts por ti. Cobran 0,2 €/s aunque no haya trabajo.',
  'Pueden responder': 'Prompts por segundo que pueden responder tus anotadores entre todos. Si es más que lo que llega, te sobra gente.',
  Sueldos: 'Lo que pagas cada segundo a los anotadores.',
  'Datos limpios generados': 'Cada prompt que responde un anotador deja 2.000 tokens de datos de calidad 1,0 para entrenar.',
  'Riesgo de auditoría (cada 60 s)': 'Cada minuto, un 2 % por anotador de que descubran que tu "IA" son personas. Si pasa, pierdes la mitad del dinero y 20 de reputación.',

  // Entrenamiento (Fase 1)
  Tokens: 'Cuántos de tus datos usas para entrenar. Más tokens = más capacidad, pero la ganancia se satura hacia los 600 M y el coste y el tiempo crecen en línea recta.',
  Épocas: 'Cuántas veces repasa el modelo los datos. 3 es lo mejor (×1,1); 2 da casi lo mismo (×1,0) por menos coste; con 4 o 5 se sobreajusta y empeora.',
  'Computación C = 6·N·D': 'FLOPs que cuesta el entrenamiento: 6 × parámetros × tokens vistos (tokens × épocas). De aquí salen el coste y la duración.',
  'Capacidad esperada': 'Capacidad (0–100) que tendrá el modelo si el entrenamiento sale bien. Más capacidad = más usuarios posibles (capacidad² × 0,5 × (1 + reputación/100)).',
  'Duración estimada': 'Segundos que tardará con las GPUs asignadas a entrenar (mínimo 10 s). Más GPUs o más reparto hacia "entrenar" = más rápido.',
  Modelo: 'Nombre del modelo que se está entrenando.',
  Gastado: 'Dinero que llevas metido en este entrenamiento. Si falla sin checkpoints, se pierde.',

  // Computación
  'GPUs de consumo': 'GPUs de segunda mano que son tuyas: 1e14 FLOP/s cada una y 0,05 €/s de luz. Cada una sale un 12 % más cara que la anterior.',
  'GPUs alquiladas': 'GPUs en la nube: 4 veces más potentes que las de consumo, pero cuestan 3 €/s cada una mientras las tengas.',
  Potencia: 'FLOP/s totales de todas tus GPUs. Se reparten entre entrenar y servir según la barra de reparto.',
  'Reparto entrenamiento / inferencia':
    'Qué parte de tus GPUs entrena modelos y qué parte atiende a los usuarios. Lo que va a entrenar acelera el entrenamiento; lo que va a servir decide cuántos usuarios puedes atender. Si no estás entrenando, lo dedicado a entrenar no hace nada.',
  'Escasez de GPUs': 'Un evento ha disparado los precios: las GPUs cuestan ×1,5 durante dos trimestres.',

  // Datos
  'Tokens disponibles': 'Todos los datos que tienes para entrenar. No se gastan al entrenar: puedes reutilizarlos.',
  'Calidad media': 'Media de la calidad de tus datos (limpios y con licencia 1,0; scrapeados 0,8). Multiplica lo que gana el modelo al entrenar.',
  'Riesgo de demanda': 'Probabilidad (en %) de que te demanden por copyright en cada comprobación (cada 30 s). Sube con lo scrapeado.',

  // Producto
  'Objetivo de usuarios': 'Usuarios que puede llegar a tener tu producto con el modelo actual: capacidad² × 0,5 × (1 + reputación/100). Los usuarios reales se acercan a este número poco a poco.',
  'Pueden servirse': 'Usuarios que aguantan tus GPUs dedicadas a servir (unos 120 por GPU de consumo con el modelo pequeño). Si es menor que el objetivo, te faltan GPUs de inferencia.',
  Ingresos: 'Cada usuario paga 0,05 €/s.',
  'Coste de inferencia': 'Cada usuario te cuesta 0,01 €/s en servidores.',
  'Benchmark propio': 'La capacidad que enseñas al mundo. Si contaminas el benchmark, sale +10 por encima de la real.',
  Usuarios: 'Usuarios de pago de tu producto.',

  // Investigación
  Investigadores: 'Cada uno genera 0,1 ideas/s, suma +2 % de probabilidad de éxito y cobra 2 €/s. El primero desbloquea las ablaciones.',
  Sénior: 'Investigadoras sénior: 0,5 ideas/s y +4 % de probabilidad de éxito. Cobran 20 €/s.',
  Ideas: 'Se gastan en mejoras (checkpoints, monitorización…) que suben la probabilidad de éxito o la eficiencia.',
};

export const HELP_TOGGLES = {
  scraping: 'Descarga datos de internet: +2 M tokens/s gratis, pero de calidad 0,8 y sube el riesgo de demanda. Con unos 600 M de tokens ya puedes apagarlo.',
  synthetic: 'El propio modelo genera datos. Si pasan del 40 % del total, el modelo empeora (model collapse).',
  contaminate: 'Tu benchmark sale +10 y consigues más usuarios. Cada minuto hay un 5 % de que te pillen: hype −20 y reputación −15.',
};

export const HELP_P = 'Probabilidad de que el entrenamiento salga bien. Si falla, se para entre el 20 % y el 90 % y pierdes lo gastado (con checkpoints puedes reanudar pagando una parte).';
