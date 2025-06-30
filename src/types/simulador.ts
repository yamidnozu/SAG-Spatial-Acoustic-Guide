// Tipos y enumeraciones para el simulador de audio espacial

/**
 * Tipos de timbre disponibles para las fuentes de sonido.
 */
export type Timbre = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * Representa una fuente de sonido espacial en el simulador.
 */
export interface FuenteSonido {
  id: string; // Identificador único de la fuente
  color: string; // Color visual de la fuente
  frecuenciaBase: number; // Frecuencia base del oscilador
  timbre: Timbre; // Tipo de onda
  posicion: {
    x: number; // Coordenada X normalizada (0 a 1)
    y: number; // Coordenada Y normalizada (0 a 1)
  };
  distanciaNormalizada: number; // Distancia al centro, normalizada (0 a 1)
}

/**
 * Estado global del simulador de audio espacial.
 */
// Ampliar el estado global para incluir el objeto más próximo (para sonificación avanzada)
import type { SonificacionParams } from '../hooks/useSonificacionAvanzada';

export interface EstadoSimulador {
  fuentes: FuenteSonido[]; // Lista de fuentes activas
  audioIniciado: boolean; // Indica si el audio está activo
  objetoProximo: SonificacionParams | null; // Objeto más próximo para sonificación avanzada
}
