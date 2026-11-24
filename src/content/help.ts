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
  'Capacidad esperada': 'Capacidad (0–100) que tendrá el modelo si sale bien. En la Fase 1 decide cuántos usuarios puedes tener (capacidad² × 0,5 × (1 + reputación/100)); en la Fase 2, la demanda de tu API (crece con la capacidad al cubo). A los preentrenados el SFT les suma +5.',
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
  Investigadores: 'Cada investigador normal genera 0,1 ideas/s, suma +2 % de probabilidad de éxito y cobra 2 €/s. El primero desbloquea las ablaciones.',
  Sénior: 'Investigadoras sénior: 0,5 ideas/s y +4 % de probabilidad de éxito. Cobran 20 €/s.',
  Ideas: 'Se gastan en mejoras (checkpoints, monitorización…) que suben la probabilidad de éxito o la eficiencia.',

  // Barra superior
  'bar:Ingresos': 'Lo que entra menos lo que sale cada segundo (media de los últimos segundos). Si es negativo, estás quemando caja.',
  Dinero: 'Caja disponible. En las Fases 0 y 1 no puede bajar de 0 (si no llegas a pagar sueldos, se va gente). Desde la Fase 2 sí: 60 s seguidos en negativo terminan la partida.',
  ARR: 'Ingresos anuales recurrentes: lo que ingresas por segundo proyectado a un año. Es lo que mira la junta y lo que más pesa en la valoración.',
  Valoración: 'Lo que dicen los inversores que vale la empresa: ARR × (5 + hype/10) + un extra por la capacidad del modelo lanzado, multiplicado por la "memoria del mercado" (juntas cumplidas, lanzamientos decepcionantes…).',
  Hype: 'De 0 a 100. Sube la demanda de tu API y la valoración. Baja un 0,3 % por segundo, y de golpe con escándalos.',
  Fase: 'Etapa de la empresa. Cada fase desbloquea sistemas nuevos.',

  // Preentrenamiento (Fase 2)
  'Parámetros (N)': 'Tamaño del modelo. Más parámetros = mejor modelo, pero más cómputo para entrenarlo y más GPUs para servirlo (cada GPU sirve menos tokens/s).',
  'Tokens (D)': 'Datos con los que se entrena. Puedes repetir tu dataset hasta 4 veces; para más, consigue datos (scraping, licencias).',
  'Eficiencia de escalado': 'Ley de Chinchilla (Hoffmann et al., 2022): con un cómputo fijo, lo óptimo es D ≈ 20 × N. 100 % = repartes bien; si baja, desperdicias FLOPs. El botón "Ajustar D ≈ 20·N" lo arregla.',
  'Duración · coste': 'Segundos que tardará con las GPUs asignadas a entrenar y lo que pagas al empezar (energía y operaciones).',
  'Amabilidad (RLHF)': 'Cómo de complaciente es el modelo. Por debajo de 40, cada minuto puede haber un escándalo por maleducado. Por encima de 85 rechaza peticiones legítimas y baja la demanda. Lo óptimo: 60–75.',

  // Hype y expectativas
  'Capacidad real': 'Capacidad del modelo que tienes en producción.',
  Expectativa: 'Lo que el mercado cree que vas a sacar. Sube al prometer. Al lanzar, si tu modelo está por debajo, pagas la diferencia en valoración y hype, y la expectativa baja a tu capacidad real.',
  'Deuda de expectativas': 'Expectativa menos capacidad real. Al lanzar, cada punto de deuda resta un 2 % de valoración y 1 de hype. Si la expectativa supera 1,6 veces tu capacidad con una valoración de 1 mil M€ o más, estalla la burbuja.',
  Dilución: '% de la empresa que ya no es tuya. Cada ronda la sube; con un 90 % ya no hay más rondas.',

  // Computación (Fase 2+)
  'GPUs de datacenter': 'Tuyas, 4e14 FLOP/s y 0,4 €/s cada una. Cada GPU sale un 3 % más cara que la anterior; en la Fase 3 los centros de datos propios abaratan la escalada.',
  'Huecos libres': 'Sitio para más GPUs propias. En la Fase 3 necesitas centros de datos para tener más.',

  // API
  'Tu precio': '€ por millón de tokens. Más barato = más demanda; los ingresos crecen al bajar el precio mientras puedas servir toda la demanda.',
  'Precio de mercado': 'Lo que cobra la competencia. Cae cuando los rivales lanzan modelos o liberan pesos abiertos. Si tu precio está por encima, pierdes demanda.',
  'Demanda / capacidad': 'Tokens/s que te piden frente a los que puedes servir con las GPUs dedicadas a inferencia. Si la demanda supera tu capacidad en más de un 20 %, hay latencia y baja la reputación.',
  Margen: 'Ingresos menos gastos por segundo.',
  'Modelo servido': 'El modelo que atiende la API. Cambia al lanzar uno nuevo.',

  // Junta
  'ARR objetivo': 'Lo que la junta exige al cerrar el trimestre: 1,5 veces el ARR del trimestre anterior (mínimo 1 M€).',
  'Capacidad objetivo': 'Capacidad del mejor rival menos 5. Cuenta la del modelo que tienes lanzado.',
  Capacidad: 'Capacidad de tu modelo lanzado.',

  // Talento
  'Equity repartida (del pool del 10 %)': 'Acciones que repartes entre el equipo. Más equity = menos probabilidad de que se vayan a la competencia.',
  'P(fuga) este trimestre': 'Probabilidad de que al cerrar el trimestre se vaya entre el 20 % y el 50 % del equipo: 0,1 × (investigadores / 10) × (1 − equity). Si se van 5 o más, fundan un rival.',

  // Contratos
  Pide: 'Capacidad mínima del modelo y tokens/s que tienes que reservarles. Se descuentan de tu capacidad de servicio.',
  Paga: 'Ingreso fijo por segundo mientras dure. Si no cumples (capacidad o tokens/s), pagas 3 veces lo que dejas de servir.',

  // Fase 3: centros de datos y energía
  'GPUs propias / huecos': 'GPUs que tienes frente al sitio que tienes para ellas. Cada centro de datos añade 20.000 huecos.',
  'Energía necesaria / disponible': 'Megavatios que necesitan tus GPUs (1 kW cada una × 2,5 por refrigeración) frente a los que tienes contratados o generas.',
  'GPUs sin energía': 'Parte de tus GPUs propias que están apagadas porque no hay megavatios suficientes. No rinden nada.',
  'Precio medio': 'Precio medio de tu electricidad: red 80 €/MWh, solar 30 €/MWh, nuclear 20 €/MWh, ajustado por la ubicación de tus centros de datos.',
  'Factura eléctrica': 'Lo que pagas por segundo de energía (1 s de juego = 1 hora).',

  // Regulación y seguridad
  'Cumplimiento normativo': 'De 0 a 100. Baja 15 cada vez que lanzas sin evaluar. Por debajo de 30: multas (5 % de los ingresos del trimestre) y comparecencias que bloquean los lanzamientos.',
  'Por debajo de 30: multas y comparecencias': 'Sube el cumplimiento evaluando modelos antes de lanzarlos (+10) o con lobby (+5).',
  'Comparecencia: lanzamientos bloqueados': 'Mientras dure, no puedes lanzar modelos.',
  Seguridad: 'De 0 a 1. Reduce los incidentes graves al lanzar. Si llegas a capacidad 98 con seguridad ≥ 0,6 tienes el final "AGI"; por debajo, "AGI sin frenos".',
  'Equipos de seguridad': 'Cada equipo suma +0,12 de seguridad y cuesta 2 investigadores y 300 ideas.',
  'P(incidente grave) por lanzamiento': '0,15 × (1 − seguridad). Un incidente: hype −40 y cumplimiento −30.',

  // Salida a bolsa
  'Trimestres seguidos con beneficio': 'Trimestres en los que ingresaste más de lo que gastaste. Hacen falta 2 seguidos (y una valoración de 500 mil M€) para salir a bolsa.',
};

export const HELP_HEADINGS = {
  ranking: 'Capacidad del último modelo lanzado de cada laboratorio. Entrar en el top 3 (o llegar a 10 mil M€ de valoración) te lleva a la Fase 3.',
  optimizations: 'Mejoras de investigación que multiplican los tokens/s que sirve cada GPU. Cuantización y destilación bajan un poco la capacidad del modelo.',
  buyGpus: 'El precio sube un 3 % por cada GPU que ya tienes. Los botones compran varias de golpe al precio acumulado.',
  rent: 'GPUs en la nube a 3 €/s cada una. El proveedor solo te da un cupo, que crece cada trimestre.',
  chips: 'I+D de 2.000 M€ y 240 s: las GPUs pasan a costar un 40 % menos y rinden un 25 % más.',
  energy: 'Red: inmediata pero cara y limitada a 150 MW. Solar: 100 MW baratos en 90 s. Nuclear: 1.000 MW muy baratos en 300 s.',
  datacenter: 'Cada centro de datos cuesta 500 M€ (menos la subvención del sitio), tarda 120 s y da 20.000 huecos para GPUs. Necesita 50 MW.',
};

export const HELP_TOGGLES = {
  scraping: 'Descarga datos de internet: +2 M tokens/s gratis, pero de calidad 0,8 y sube el riesgo de demanda. Con unos 600 M de tokens ya puedes apagarlo.',
  synthetic: 'El propio modelo genera datos. Si pasan del 40 % del total, el modelo empeora (model collapse).',
  contaminate: 'Tu benchmark sale +10 y consigues más usuarios. Cada minuto hay un 5 % de que te pillen: hype −20 y reputación −15.',
};

export const HELP_P = 'Probabilidad de que el entrenamiento salga bien. Si falla, se para entre el 20 % y el 90 % y pierdes lo gastado (con checkpoints puedes reanudar pagando una parte).';
