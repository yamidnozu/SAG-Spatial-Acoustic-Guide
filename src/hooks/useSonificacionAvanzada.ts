import { useEffect, useRef } from 'react';
import type { Timbre } from '../types/simulador';
import type { ControlesFuenteAudio } from './useAudioSource';
import { crearControlesFuenteAudio } from './useAudioSource';

// Tipos para los parámetros de sonificación
export interface SonificacionParams {
  distancia: number;
  posicion: { x: number; y: number };
  tipo?: string;
}

// Opciones de personalización para el usuario
export interface OpcionesSonificacion {
  volumenMax?: number; // Volumen máximo (0-1)
  tempoMin?: number;   // Tempo mínimo (Hz)
  tempoMax?: number;   // Tempo máximo (Hz)
  duracionBeep?: number; // Duración beep (segundos)
  habilitarHaptico?: boolean; // Feedback háptico
}

// Hook de sonificación avanzada: crea y controla una fuente de audio espacializada y feedback háptico
export function useSonificacionAvanzada(
  objetoProximo: SonificacionParams | null,
  opciones: OpcionesSonificacion = {}
) {
  const fuenteAudioRef = useRef<ControlesFuenteAudio | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const beepIntervalRef = useRef<number | null>(null);

  // Inicializa el contexto y la fuente de audio una vez
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (!fuenteAudioRef.current && audioContextRef.current) {
      fuenteAudioRef.current = crearControlesFuenteAudio({
        audioContext: audioContextRef.current,
        frecuenciaBase: 440,
        timbre: 'sine',
      });
      fuenteAudioRef.current.iniciar();
    }
    return () => {
      fuenteAudioRef.current?.desconectar();
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    };
  }, []);

  // Actualiza los parámetros de la fuente según el objeto más próximo y aplica feedback háptico
  useEffect(() => {
    if (!fuenteAudioRef.current) return;
    if (!objetoProximo) {
      fuenteAudioRef.current.setGanancia(0.0);
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      return;
    }
    const { distancia, posicion, tipo } = objetoProximo;
    // Personalización
    const volumenMax = opciones.volumenMax ?? 0.7;
    const tempoMin = opciones.tempoMin ?? 1;
    const tempoMax = opciones.tempoMax ?? 5;
    const duracionBeep = opciones.duracionBeep ?? 0.08;
    const habilitarHaptico = opciones.habilitarHaptico ?? true;
    // Mapeos sensoriales
    const pitch = 1200 - Math.min(Math.max(distancia, 0), 2) * 450;
    const volumen = volumenMax - Math.min(Math.max(distancia, 0), 2) * (volumenMax - 0.1);
    let timbre: Timbre = 'sine';
    switch (tipo) {
      case 'persona': timbre = 'triangle'; break;
      case 'pared': timbre = 'square'; break;
      case 'puerta': timbre = 'sawtooth'; break;
    }
    fuenteAudioRef.current.setFrecuencia(pitch);
    fuenteAudioRef.current.setPosicion((posicion.x - 0.5) * 2, 0, (posicion.y - 0.5) * 2);
    fuenteAudioRef.current.setTimbre(timbre);

    // --- Feedback tipo beep/tempo + háptico ---
    // Calcula el tempo (beeps por segundo, rango tempoMin-tempoMax Hz)
    const tempo = tempoMax - Math.min(Math.max(distancia, 0), 2) * (tempoMax - tempoMin);
    const beepInterval = 1000 / tempo; // ms

    if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    // Si la distancia es mayor a 2, no emitir sonido
    if (distancia > 2) {
      fuenteAudioRef.current.setGanancia(0.0);
      return;
    }
    fuenteAudioRef.current.setGanancia(0.0);
    beepIntervalRef.current = window.setInterval(() => {
      fuenteAudioRef.current?.setGanancia(volumen);
      // Feedback háptico sincronizado
      if (habilitarHaptico && 'vibrate' in navigator) {
        navigator.vibrate?.(duracionBeep * 1000);
      }
      setTimeout(() => {
        fuenteAudioRef.current?.setGanancia(0.0);
      }, duracionBeep * 1000);
    }, beepInterval);
  }, [objetoProximo, opciones]);
}
