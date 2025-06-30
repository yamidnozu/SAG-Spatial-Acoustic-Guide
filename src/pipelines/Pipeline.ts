// Clase base para pipelines de procesamiento

export interface TareaPipeline<Entrada, Salida> {
  ejecutar(entrada: Entrada): Salida;
}

export class Pipeline<TEntrada, TSalida> {
  private tareas: Array<TareaPipeline<unknown, unknown>> = [];

  agregarTarea<TSiguiente>(tarea: TareaPipeline<TSalida, TSiguiente>): Pipeline<TEntrada, TSiguiente> {
    this.tareas.push(tarea as TareaPipeline<unknown, unknown>);
    // Devuelve un nuevo pipeline con el tipo de salida actualizado
    return this as unknown as Pipeline<TEntrada, TSiguiente>;
  }

  ejecutar(entrada: TEntrada): TSalida {
    return this.tareas.reduce((acc, tarea) => tarea.ejecutar(acc), entrada as unknown) as TSalida;
  }
}
