import { useEffect, useRef } from 'react';

interface ConfiguracionBeepProximidad {
  audioContext: AudioContext;
  frecuenciaBase: number;
  distanciaNormalizada: number;
  setFrecuencia: (frecuencia: number) => void;
  setGanancia: (ganancia: number, tiempo?: number) => void;
}

const PROXIMIDAD_VOLUMEN_BEEP_MAX = 0.5;
const PROXIMIDAD_INTERVALO_BEEP_MAX = 1500; // ms
const PROXIMIDAD_INTERVALO_BEEP_MIN = 150; // ms
const PROXIMIDAD_PITCH_SHIFT_MAX = 100; // Hz
const BEEP_TIEMPO_ATAQUE = 0.01; // segundos
const BEEP_TIEMPO_DECAY = 0.18; // segundos
const PROXIMIDAD_UMBRAL_BEEP = 0.99; // distancia normalizada

export const useBeepProximidad = ({ audioContext, frecuenciaBase, distanciaNormalizada, setFrecuencia, setGanancia }: ConfiguracionBeepProximidad) => {
  const intervaloBeepRef = useRef<number | null>(null);

  useEffect(() => {
    // Limpiar cualquier intervalo existente al re-renderizar o desmontar
    if (intervaloBeepRef.current) {
      clearInterval(intervaloBeepRef.current);
      intervaloBeepRef.current = null;
    }

    if (distanciaNormalizada < PROXIMIDAD_UMBRAL_BEEP) {
      const factorProx = Math.pow(1 - distanciaNormalizada, 2);
      const volumenBeep = factorProx * PROXIMIDAD_VOLUMEN_BEEP_MAX;
      const intervaloBeep = PROXIMIDAD_INTERVALO_BEEP_MAX - ((PROXIMIDAD_INTERVALO_BEEP_MAX - PROXIMIDAD_INTERVALO_BEEP_MIN) * factorProx);

      intervaloBeepRef.current = window.setInterval(() => {
        const ahora = audioContext.currentTime;
        const pitchShift = PROXIMIDAD_PITCH_SHIFT_MAX * factorProx;
        const frecuenciaActual = frecuenciaBase + pitchShift;

        setFrecuencia(frecuenciaActual);
        setGanancia(0, ahora);
        setGanancia(volumenBeep, ahora + BEEP_TIEMPO_ATAQUE);
        setGanancia(0, ahora + BEEP_TIEMPO_DECAY);
      }, intervaloBeep);
    }

    return () => {
      if (intervaloBeepRef.current) {
        clearInterval(intervaloBeepRef.current);
      }
    };
  }, [audioContext, frecuenciaBase, distanciaNormalizada, setFrecuencia, setGanancia]);

  // Función para detener el beep manualmente (ej. al arrastrar)
  const detenerBeep = () => {
    if (intervaloBeepRef.current) {
      clearInterval(intervaloBeepRef.current);
      intervaloBeepRef.current = null;
    }
    setGanancia(0); // Asegurarse de que el sonido se detenga
  };

  return { detenerBeep };
};
