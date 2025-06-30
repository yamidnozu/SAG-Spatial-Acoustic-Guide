import { useEffect } from 'react';
import type { OpcionesSonificacion, SonificacionParams } from './useSonificacionAvanzada';
import { useSonificacionAvanzada } from './useSonificacionAvanzada';

/**
 * Hook que observa el estado global y activa la sonificación avanzada
 * para el objeto más próximo detectado por sensores o simulación.
 * Ahora acepta opciones de personalización.
 */
export function useObjetoProximo(params: { objetoProximo?: SonificacionParams | null, opcionesSonificacion?: OpcionesSonificacion }) {
  useSonificacionAvanzada(params.objetoProximo ?? null, params.opcionesSonificacion);
  // Si quieres actualizar la UI visual, puedes hacerlo aquí también
  useEffect(() => {
    if (params.objetoProximo) {
      // Aquí podrías actualizar la posición visual, etc.
      // moverFuenteVirtual(params.objetoProximo.posicion);
      // ajustarAudioPorDistancia(params.objetoProximo.distancia);
    }
  }, [params.objetoProximo]);
}
