// Procesador de arrastre de fuentes para el simulador de audio espacial
import type { FuenteSonido } from '../types/simulador';

/**
 * Evento que representa el arrastre de una fuente de sonido.
 */
export interface EventoArrastre {
  idFuente: string; // ID de la fuente arrastrada
  posicion: { x: number; y: number }; // Nueva posición normalizada
}

/**
 * Procesador que actualiza la posición de una fuente de sonido en la lista.
 */
export class ProcesadorArrastreFuentes {
  ejecutar(fuentes: FuenteSonido[], evento: EventoArrastre): FuenteSonido[] {
    return fuentes.map(fuente =>
      fuente.id === evento.idFuente
        ? { ...fuente, posicion: evento.posicion }
        : fuente
    );
  }
}
