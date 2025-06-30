import { useEffect, useRef, useState } from 'react';
import { Pipeline } from '../pipelines/Pipeline';
import type { AccionSimulador, ContextoSimulador } from '../pipelines/TareasSimulador';
import { TareaAgregarFuente, TareaEliminarUltimaFuente, TareaMoverFuente } from '../pipelines/TareasSimulador';
import type { EstadoSimulador } from '../types/simulador';
import type { EventoArrastre } from '../utils/ArrastreFuentesProcessor';
import { crearControlesFuenteAudio } from './useAudioSource';

// Variables de configuración relevantes
const PROXIMIDAD_VOLUMEN_BEEP_MAX = 0.5;

interface FuenteAudioControls {
  id: string;
  setFrequency: (freq: number) => void;
  setGain: (gain: number, time?: number) => void;
  setPosition: (x: number, y: number, z: number, time?: number) => void;
  start: () => void;
  stop: () => void;
  disconnect: () => void;
  intervaloBeep: number | null;
}

export function useSimuladorAudioEspacial() {
  const [estado, setEstado] = useState<EstadoSimulador>({ fuentes: [], audioIniciado: false, objetoProximo: null });
  const audioContextRef = useRef<AudioContext | null>(null);
  const fuentesAudioControlsRef = useRef<FuenteAudioControls[]>([]);

  // Pipeline principal: todas las acciones pasan por aquí
  const pipeline = useRef(
    new Pipeline<ContextoSimulador, ContextoSimulador>()
      .agregarTarea(new TareaAgregarFuente())
      .agregarTarea(new TareaEliminarUltimaFuente())
      .agregarTarea(new TareaMoverFuente())
  );

  const iniciarAudio = () => {
    if (estado.audioIniciado) return;
    audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // Forzar posición y orientación del listener para simetría
    const ctx = audioContextRef.current;
    if (ctx) {
      const listener: AudioListener = ctx.listener;
      const now = ctx.currentTime;
      if (listener.positionX) {
        listener.positionX.setValueAtTime(0, now);
        listener.positionY.setValueAtTime(0, now);
        listener.positionZ.setValueAtTime(0, now);
        listener.forwardX.setValueAtTime(0, now);
        listener.forwardY.setValueAtTime(0, now);
        listener.forwardZ.setValueAtTime(-1, now);
        listener.upX.setValueAtTime(0, now);
        listener.upY.setValueAtTime(1, now);
        listener.upZ.setValueAtTime(0, now);
      } else if (typeof listener.setPosition === 'function' && typeof listener.setOrientation === 'function') {
        listener.setPosition(0, 0, 0);
        listener.setOrientation(0, 0, -1, 0, 1, 0);
      }
    }
    setEstado((estadoActual: EstadoSimulador) => ({ ...estadoActual, audioIniciado: true }));
  };

  const despachar = (accion: AccionSimulador) => {
    setEstado((estadoActual: EstadoSimulador) => {
      const resultado = pipeline.current.ejecutar({ estado: estadoActual, accion });
      return resultado.estado;
    });
  };

  const agregarFuente = () => {
    if (!estado.audioIniciado || !audioContextRef.current) return;
    despachar({ tipo: 'agregarFuente' });
  };

  // Efecto: inicializar audio real cada vez que se agregue una fuente
  useEffect(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    if (estado.fuentes.length > fuentesAudioControlsRef.current.length) {
      const fuente = estado.fuentes[estado.fuentes.length - 1];
      if (fuente) {
        const audioControls = crearControlesFuenteAudio({
          audioContext,
          frecuenciaBase: fuente.frecuenciaBase,
          timbre: fuente.timbre,
        });
        fuentesAudioControlsRef.current.push({
          id: fuente.id,
          setFrequency: audioControls.setFrecuencia,
          setGain: audioControls.setGanancia,
          setPosition: audioControls.setPosicion,
          start: audioControls.iniciar,
          stop: audioControls.detener,
          disconnect: audioControls.desconectar,
          intervaloBeep: null,
        });
        audioControls.setGanancia(PROXIMIDAD_VOLUMEN_BEEP_MAX);
        audioControls.iniciar();
      }
    }
  }, [estado.fuentes]); // Corregido: dependencias completas

  // Efecto: sincronizar posición y volumen de cada fuente de audio con el estado global
  useEffect(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    // Sincronizar cada fuente de audio con su posición y volumen
    estado.fuentes.forEach((fuente: EstadoSimulador['fuentes'][number], idx: number) => {
      const audioControls = fuentesAudioControlsRef.current[idx];
      if (!audioControls) return;
      // Convertir posición normalizada (0-1) a espacio 3D (por ejemplo, círculo de radio 1)
      const x = (fuente.posicion.x - 0.5) * 2; // [-1, 1]
      const y = 0; // plano 2D
      const z = (fuente.posicion.y - 0.5) * 2; // [-1, 1]
      audioControls.setPosition(x, y, z);
      // Ajustar el volumen según la distancia al centro (persona)
      // Volumen máximo en el centro, casi cero en el borde, caída cuadrática
      const distancia = Math.sqrt(Math.pow(fuente.posicion.x - 0.5, 2) + Math.pow(fuente.posicion.y - 0.5, 2)) * 2;
      const volumenMin = 0.001; // Casi inaudible en el borde
      const t = Math.min(Math.max(distancia, 0), 1); // [0,1]
      const volumen = volumenMin + (PROXIMIDAD_VOLUMEN_BEEP_MAX - volumenMin) * Math.pow(1 - t, 2); // caída cuadrática
      audioControls.setGain(volumen);
    });
    // Silenciar y desconectar controles sobrantes si se eliminaron fuentes
    for (let i = estado.fuentes.length; i < fuentesAudioControlsRef.current.length; i++) {
      fuentesAudioControlsRef.current[i].setGain(0);
    }
  }, [estado.fuentes]);

  const eliminarUltimaFuente = () => {
    despachar({ tipo: 'eliminarUltimaFuente' });
    // Limpiar audio real
    const fuenteAudioControls = fuentesAudioControlsRef.current.pop();
    if (fuenteAudioControls) {
      fuenteAudioControls.disconnect();
      if (fuenteAudioControls.intervaloBeep) {
        clearInterval(fuenteAudioControls.intervaloBeep);
      }
    }
  };

  const moverFuente = (evento: EventoArrastre) => {
    despachar({ tipo: 'moverFuente', evento });
  };

  // Arrastre: solo se mantiene el volumen, no se usan intervalos ni lógica de beep
  const iniciarArrastreFuente = (id: string) => {
    const fuenteAudioControls = fuentesAudioControlsRef.current.find(f => f.id === id);
    if (fuenteAudioControls) {
      fuenteAudioControls.setGain(PROXIMIDAD_VOLUMEN_BEEP_MAX);
    }
  };

  // Ya no se usa el parámetro id, así que lo eliminamos
  const terminarArrastreFuente = () => {};

  /**
   * DIAGRAMA DE FLUJO PIPELINE (documentación visual)
   *
   * [UI/Componente]
   *      │
   *      ▼
   * [useSimuladorAudioEspacial]
   *      │
   *      ▼
   * ┌───────────────────────────────┐
   * │   Pipeline de tareas SAG      │
   * │ ───────────────────────────── │
   * │ [TareaAgregarFuente]          │
   * │ [TareaEliminarUltimaFuente]   │
   * │ [TareaMoverFuente]            │
   * └───────────────────────────────┘
   *      │
   *      ▼
   * [Estado global actualizado]
   *      │
   *      ▼
   * [React renderiza UI y gestiona audio]
   *
   * Cada acción (agregar, eliminar, mover) se despacha al pipeline,
   * que ejecuta todas las tareas en orden. Solo la tarea relevante modifica el estado.
   * El estado resultante se usa para actualizar la UI y el audio.
   */


  return {
    fuentes: estado.fuentes,
    audioIniciado: estado.audioIniciado,
    iniciarAudio,
    agregarFuente,
    eliminarUltimaFuente,
    moverFuente,
    iniciarArrastreFuente,
    terminarArrastreFuente,
    objetoProximo: estado.objetoProximo,
  };
}
