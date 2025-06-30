// Tipos y tareas para el pipeline del simulador de audio espacial
import type { TareaPipeline } from '../pipelines/Pipeline';
import type { EstadoSimulador, FuenteSonido } from '../types/simulador';
import type { EventoArrastre } from '../utils/ArrastreFuentesProcessor';
import { ProcesadorArrastreFuentes } from '../utils/ArrastreFuentesProcessor';

/**
 * Arquitectura pipeline SAG: cada acción del simulador (agregar, eliminar, mover fuente)
 * se modela como una tarea que transforma el contexto (estado + acción).
 * El pipeline ejecuta todas las tareas en orden, permitiendo composición y extensión.
 *
 * Paso a paso:
 * 1. El hook despacha una acción (AccionSimulador) junto con el estado actual.
 * 2. El pipeline recorre todas las tareas y cada una decide si actúa según el tipo de acción.
 * 3. El estado resultante se devuelve y React actualiza la UI.
 * 4. Para agregar lógica (validaciones, sensores, etc.), basta con agregar nuevas tareas.
 *
 * Ejemplo de extensión:
 * - Para integrar sensores reales, crea una tarea que procese la acción 'actualizarDesdeSensor'.
 * - Para validar límites, crea una tarea que filtre fuentes antes de agregarlas.
 */

// Acciones posibles en el simulador
export type AccionSimulador =
  | { tipo: 'agregarFuente' }
  | { tipo: 'eliminarUltimaFuente' }
  | { tipo: 'moverFuente'; evento: EventoArrastre };

// Contexto que fluye por el pipeline
type ContextoSimulador = {
  estado: EstadoSimulador;
  accion: AccionSimulador;
};

// Tarea: agregar fuente
export class TareaAgregarFuente implements TareaPipeline<ContextoSimulador, ContextoSimulador> {
  ejecutar(ctx: ContextoSimulador): ContextoSimulador {
    if (ctx.accion.tipo !== 'agregarFuente') return ctx;
    const idx = ctx.estado.fuentes.length;
    // Colores y timbres más relajantes
    const colores = ['#60A5FA', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#818CF8'];
    const frecuencias = [220.0, 261.63, 293.66, 329.63, 349.23, 392.0]; // tonos más graves y suaves
    const timbres = ['sine', 'triangle', 'sine', 'triangle', 'sine', 'triangle'] as const; // solo sine y triangle
    const nuevaFuente: FuenteSonido = {
      id: `fuente-${Date.now()}`,
      color: colores[idx % colores.length],
      frecuenciaBase: frecuencias[idx % frecuencias.length],
      timbre: timbres[idx % timbres.length],
      posicion: { x: 0.5, y: 0.5 },
      distanciaNormalizada: 0,
    };
    return {
      ...ctx,
      estado: {
        ...ctx.estado,
        fuentes: [...ctx.estado.fuentes, nuevaFuente],
      },
    };
  }
}

// Tarea: eliminar última fuente
export class TareaEliminarUltimaFuente implements TareaPipeline<ContextoSimulador, ContextoSimulador> {
  ejecutar(ctx: ContextoSimulador): ContextoSimulador {
    if (ctx.accion.tipo !== 'eliminarUltimaFuente') return ctx;
    return {
      ...ctx,
      estado: {
        ...ctx.estado,
        fuentes: ctx.estado.fuentes.slice(0, -1),
      },
    };
  }
}

// Tarea: mover fuente
export class TareaMoverFuente implements TareaPipeline<ContextoSimulador, ContextoSimulador> {
  private procesador = new ProcesadorArrastreFuentes();
  ejecutar(ctx: ContextoSimulador): ContextoSimulador {
    if (ctx.accion.tipo !== 'moverFuente') return ctx;
    return {
      ...ctx,
      estado: {
        ...ctx.estado,
        fuentes: this.procesador.ejecutar(ctx.estado.fuentes, ctx.accion.evento),
      },
    };
  }
}

export type { ContextoSimulador };

