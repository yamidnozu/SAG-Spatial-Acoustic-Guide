import type { Timbre } from '../types/simulador';

// Correcciones ESLint y buenas prácticas aplicadas en todo el proyecto.
// 1. Importaciones de tipo con 'import type' donde corresponde.
// 2. Eliminación de usos de 'any'.
// 3. Llamadas a hooks y funciones con los argumentos correctos.
// 4. Comentarios aclaratorios donde es relevante.

interface ConfiguracionFuenteAudio {
  audioContext: AudioContext;
  frecuenciaBase: number;
  timbre: Timbre;
}

export interface ControlesFuenteAudio {
  setFrecuencia: (frecuencia: number) => void;
  setGanancia: (ganancia: number, tiempo?: number) => void;
  setPosicion: (x: number, y: number, z: number, tiempo?: number) => void;
  setTimbre: (timbre: Timbre) => void;
  iniciar: () => void;
  detener: () => void;
  desconectar: () => void;
}

/**
 * Crea y controla una fuente de audio espacial (oscilador + panner + gain).
 * Devuelve funciones para manipular frecuencia, volumen, posición, timbre y ciclo de vida.
 */
export const crearControlesFuenteAudio = (config: ConfiguracionFuenteAudio): ControlesFuenteAudio => {
  const { audioContext, frecuenciaBase, timbre } = config;

  const oscilador = audioContext.createOscillator();
  const ganancia = audioContext.createGain();
  const panner = audioContext.createPanner();

  oscilador.type = timbre;
  oscilador.frequency.value = frecuenciaBase;
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 10000;
  panner.rolloffFactor = 1;

  oscilador.connect(ganancia).connect(panner).connect(audioContext.destination);
  oscilador.start();
  ganancia.gain.value = 0; // Inicia silenciado

  const setFrecuencia = (frecuencia: number) => {
    oscilador.frequency.setValueAtTime(frecuencia, audioContext.currentTime);
  };

  const setGanancia = (valor: number, tiempo?: number) => {
    ganancia.gain.setValueAtTime(valor, tiempo !== undefined ? tiempo : audioContext.currentTime);
  };

  const setPosicion = (x: number, y: number, z: number, tiempo?: number) => {
    if (panner.positionX) {
      panner.positionX.linearRampToValueAtTime(x, tiempo !== undefined ? tiempo : audioContext.currentTime + 0.1);
      panner.positionY.linearRampToValueAtTime(y, tiempo !== undefined ? tiempo : audioContext.currentTime + 0.1);
      panner.positionZ.linearRampToValueAtTime(z, tiempo !== undefined ? tiempo : audioContext.currentTime + 0.1);
    } else {
      panner.setPosition(x, y, z);
    }
  };

  const setTimbre = (nuevoTimbre: Timbre) => {
    oscilador.type = nuevoTimbre;
  };

  const iniciar = () => {
    setGanancia(0.5); // Volumen por defecto al iniciar
  };

  const detener = () => {
    setGanancia(0);
  };

  const desconectar = () => {
    oscilador.stop();
    oscilador.disconnect();
  };

  return {
    setFrecuencia,
    setGanancia,
    setPosicion,
    setTimbre,
    iniciar,
    detener,
    desconectar,
  };
};
