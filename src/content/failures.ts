// Tipos de fallo de entrenamiento (§4.3). Uno al azar por fallo.
export interface Failure {
  id: string;
  text: string;
  /** Solo puede ocurrir sin la mejora de monitorización. */
  needsNoMonitoring?: boolean;
}

export const FAILURES: Failure[] = [
  { id: 'spike', text: 'Pico de loss. La curva ha hecho un electrocardiograma y el paciente no ha sobrevivido.' },
  { id: 'divergence', text: 'Divergencia: la loss se fue al infinito y no ha dejado nota.' },
  { id: 'tokenizer', text: 'Bug del tokenizador: "SolidGoldMagikarp" aparece en el 40 % de las respuestas.' },
  { id: 'dupes', text: 'Datos duplicados: el modelo ha memorizado el mismo foro de 2009 trescientas veces.' },
  { id: 'caps', text: 'El modelo solo responde en MAYÚSCULAS. Y CON MUCHA SEGURIDAD.' },
  { id: 'gpu37', text: 'Nodo de la GPU 37 caído. Nadie sabe qué es la GPU 37. Ni siquiera hay 37 GPUs.' },
  { id: 'nan', text: 'NaN en los gradientes. Ahora todos los pesos valen "no es un número". Como la valoración.' },
  { id: 'lr', text: 'Learning rate ×1000 por un cero de más en el YAML. El YAML siempre gana.' },
  { id: 'pirate', text: 'El modelo ha decidido que es un pirata. Arrr. Los inversores no le ven la gracia.' },
  { id: 'rmrf', text: 'Un becario hizo rm -rf sobre los checkpoints. Dice que "solo quería liberar espacio".', needsNoMonitoring: true },
];

export function failureText(id: string | null): string {
  return FAILURES.find((f) => f.id === id)?.text ?? 'Algo ha fallado. Nadie lo entiende, así que lo llamaremos "emergente".';
}
