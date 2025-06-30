# SAG - Spatial Acoustic Guide

Aplicación React + TypeScript para simulación y guía acústica espacial, con arquitectura de pipelines y soporte para adaptadores de sensores (mock y reales).

## Requisitos previos
- **Node.js 20.x o superior** (descárgalo en https://nodejs.org/es/download)
- **npm** (se instala junto con Node.js)

## Instalación y uso rápido

1. **Clona o descarga este repositorio**
2. Abre una terminal en la carpeta del proyecto
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
5. Abre tu navegador y visita la URL que aparece en la terminal (por defecto http://localhost:5173)

## Estructura del proyecto
- `src/components/`: Componentes de la interfaz de usuario
- `src/pipelines/`: Lógica de procesamiento y ejecución de tareas (patrón Pipeline genérico)
- `src/utils/`: Utilidades y lógica específica (como el procesador de arrastre de fuentes)
- `src/adapters/`: Adaptadores para sensores (mock y reales) - *Actualmente vacío, pendiente de implementación*
- `src/types/`: Tipos globales y compartidos
- `src/hooks/`: Hooks reutilizables

## Objetivo
Permitir a una persona, usando auriculares y el móvil, detectar obstáculos espaciales mediante audio, configurable entre 1 y 2 metros, y fácilmente adaptable a sensores reales.

## Escalabilidad: Integración de Sensores Físicos

La arquitectura del proyecto está diseñada para facilitar la integración de sensores reales (por ejemplo, sensores de proximidad, ultrasonido, LIDAR, etc.) de forma modular y escalable. Para lograrlo, se recomienda seguir estos pasos:

### 1. Uso de Adaptadores
- Implementa un **adaptador** por cada tipo de sensor físico en `src/adapters/`.
- Cada adaptador debe exponer una interfaz común (por ejemplo, `obtenerDatos(): Promise<DatoSensor>` o un observable/evento).
- Puedes partir de un adaptador mock para pruebas y luego reemplazarlo por uno real sin modificar el resto de la app.

### 2. Integración con el Pipeline
- Los datos de los sensores deben ser procesados por los **pipelines** definidos en `src/pipelines/`.
- El pipeline puede transformar, filtrar o combinar datos de múltiples sensores antes de pasarlos a los hooks o componentes.

### 3. Ejemplo de flujo de integración
1. **Crear un adaptador real** (por ejemplo, para Web Bluetooth):
   ```ts
   // src/adapters/AdaptadorProximidadBluetooth.ts
   export class AdaptadorProximidadBluetooth {
     async obtenerDistancia(): Promise<number> {
       // Lógica para leer del sensor físico vía Bluetooth
     }
   }
   ```
2. **Inyectar el adaptador en el pipeline**:
   ```ts
   import { AdaptadorProximidadBluetooth } from '../adapters/AdaptadorProximidadBluetooth';
   const adaptador = new AdaptadorProximidadBluetooth();
   pipeline.agregarTarea(async (estado) => {
     const distancia = await adaptador.obtenerDistancia();
     return { ...estado, distancia };
   });
   ```
3. **El pipeline actualiza el estado y los hooks reaccionan**.

### 4. Ventajas de esta arquitectura
- **Modularidad:** Cambia o agrega sensores sin modificar la lógica principal.
- **Testabilidad:** Usa adaptadores mock para pruebas unitarias o simulaciones.
- **Escalabilidad:** Agrega nuevos sensores o fuentes de datos fácilmente.

---

Este README se actualizará conforme avance el desarrollo.

```ts
   // src/adapters/AdaptadorSensoresMultiples.ts
   export interface LecturaSensor {
     id: string; // Ej: "frente-izq", "atras-der"
     distancia: number; // En metros
   }

   export class AdaptadorSensoresMultiples {
     async obtenerLecturas(): Promise<LecturaSensor[]> {
       // Lógica para leer los 8 sensores físicos
       return [
         { id: 'frente-izq', distancia: 0.8 },
         { id: 'frente-centro-izq', distancia: 1.1 },
         { id: 'frente-centro-der', distancia: 0.9 },
         { id: 'frente-der', distancia: 1.0 },
         { id: 'atras-izq', distancia: 1.2 },
         { id: 'atras-centro-izq', distancia: 1.3 },
         { id: 'atras-centro-der', distancia: 1.1 },
         { id: 'atras-der', distancia: 1.0 },
       ];
     }
   }
   ```
2. **Inyectar el adaptador y calcular la posición del objeto más próximo:**
   ```ts
   import { AdaptadorSensoresMultiples } from '../adapters/AdaptadorSensoresMultiples';
   const adaptador = new AdaptadorSensoresMultiples();
   pipeline.agregarTarea(async (estado) => {
     const lecturas = await adaptador.obtenerLecturas();
     // Buscar el sensor con menor distancia (objeto más cercano)
     const sensorMasCercano = lecturas.reduce((min, actual) => actual.distancia < min.distancia ? actual : min, lecturas[0]);
     // Mapear la posición del sensor a una posición 2D/3D en la interfaz
     const posicion = mapearSensorAPosicion(sensorMasCercano.id);
     return { ...estado, objetoProximo: { ...sensorMasCercano, posicion } };
   });
   // Función de ejemplo para mapear el id del sensor a una posición en pantalla/espacio
   function mapearSensorAPosicion(id: string) {
     const posiciones: Record<string, { x: number; y: number }> = {
       'frente-izq': { x: 0.2, y: 0.2 },
       'frente-centro-izq': { x: 0.4, y: 0.1 },
       'frente-centro-der': { x: 0.6, y: 0.1 },
       'frente-der': { x: 0.8, y: 0.2 },
       'atras-izq': { x: 0.2, y: 0.8 },
       'atras-centro-izq': { x: 0.4, y: 0.9 },
       'atras-centro-der': { x: 0.6, y: 0.9 },
       'atras-der': { x: 0.8, y: 0.8 },
     };
     return posiciones[id] || { x: 0.5, y: 0.5 };
   }
   ```
3. **El pipeline actualiza el estado y solo se genera un sonido en la posición del objeto más próximo.**
4. **En el hook/componente:**
   ```ts
   // Ejemplo de uso en un hook React
   import { useEffect } from 'react';

   export function useObjetoProximo(estado: any) {
     useEffect(() => {
       if (estado.objetoProximo) {
         // Actualiza la posición y el audio de la fuente virtual
         moverFuenteVirtual(estado.objetoProximo.posicion);
         ajustarAudioPorDistancia(estado.objetoProximo.distancia);
       }
     }, [estado.objetoProximo]);
   }

   // moverFuenteVirtual y ajustarAudioPorDistancia serían funciones que
   // actualizan la posición visual y los parámetros de audio (volumen, tono, etc.)
   ```

Así, el sistema solo genera un sonido en la posición del objeto más cercano detectado por los sensores, y puedes adaptar la lógica para mostrarlo en la interfaz y modificar el audio en tiempo real según la distancia y dirección.

---

> **Diagrama conceptual:**
>
> ```
>           [frente]
>    [frente-izq]   [frente-der]
>        \             /
>         \           /
>          [usuario]
>         /           \
>    [atras-izq]   [atras-der]
>           [atras]
> ```
>
> Cada sensor detecta la distancia a un objeto en su dirección. El sistema elige el más cercano y genera el sonido en esa posición relativa al usuario.

> **Nota:**
> Si tienes 8 sensores (4 adelante y 4 atrás), puedes extender el diagrama así:
>
> ```
>           [frente]
>   [frente-izq] [frente-centro-izq] [frente-centro-der] [frente-der]
>         \         |         |         /
>          \        |         |        /
>           \       |         |       /
>                    [usuario]
>           /       |         |       \
>          /        |         |        \
>   [atras-izq] [atras-centro-izq] [atras-centro-der] [atras-der]
>           [atras]
> ```
>
> Así, cada sensor cubre una dirección específica alrededor del usuario, permitiendo una detección más precisa de la ubicación de los objetos cercanos.

---

## ¿Cómo funciona el flujo actualmente? (Paso a paso)

1. **Simulación o integración de sensores:**
   - Puedes usar fuentes virtuales (simuladas en la interfaz) o conectar sensores reales mediante adaptadores.

2. **Lectura de datos:**
   - El adaptador (mock o real) obtiene las distancias de los sensores (o la posición de las fuentes virtuales).

3. **Pipeline de procesamiento:**
   - El pipeline recibe los datos, filtra y determina el objeto más cercano (el de menor distancia).
   - Se calcula la posición relativa (2D/3D) del objeto más próximo respecto al usuario.

4. **Actualización de estado global:**
   - El pipeline actualiza el estado global de la app con la información del objeto más cercano (distancia y posición).

5. **Hooks y componentes reaccionan:**
   - Un hook (por ejemplo, `useObjetoProximo`) detecta el cambio de estado y actualiza la posición visual y los parámetros de audio (volumen, tono, espacialización) de la fuente virtual.

6. **Salida de audio espacial:**
   - El usuario escucha el sonido espacializado en la dirección y con la intensidad correspondiente al objeto más cercano.

7. **Interfaz visual:**
   - La interfaz muestra la posición del usuario y la del objeto detectado, permitiendo arrastrar fuentes virtuales para simular diferentes escenarios.

---

Este flujo modular permite alternar entre simulación y hardware real, facilitando pruebas

---

## Sonificación avanzada y principios sensoriales

### ¿Cómo enriquecer el feedback auditivo para un ETA realmente sensorial?

- **Separar la lógica de decisión (qué sonificar) de la síntesis de audio (cómo sonificar).**
- **Mapear distancia a pitch, tempo y volumen:**
  - Pitch más alto y tempo más rápido a menor distancia.
  - Volumen adaptativo: nunca 0, siempre un mínimo audible (ej. 0.1-0.7).
- **Timbre y spatialización:**
  - Usa diferentes timbres para distintos tipos de objetos (si hay visión artificial o clasificación).
  - Mantén la espacialización (posición 3D) para que el usuario intuya la dirección.
- **Filtro de eventos:**
  - Solo sonifica el objeto más relevante (el más cercano o el más peligroso).
- **Permite personalización:**
  - El usuario puede elegir el nivel de detalle del feedback (solo alertas críticas, modo entrenamiento, etc.).
- **Prepara para feedback multimodal:**
  - La arquitectura debe permitir añadir vibración/háptica para alertas críticas.
- **Evita saturación auditiva:**
  - Limita la cantidad de fuentes simultáneas y prioriza alertas críticas.

### Ejemplo de flujo de sonificación avanzada

```ts
// Hook de ejemplo para sonificación avanzada
import { useEffect } from 'react';

export function useSonificacionAvanzada(objetoProximo: { distancia: number; posicion: { x: number; y: number }, tipo?: string }) {
  useEffect(() => {
    if (!objetoProximo) return;
    // Mapea distancia a pitch, tempo y volumen
    const pitch = mapearDistanciaAPitch(objetoProximo.distancia);
    const tempo = mapearDistanciaATempo(objetoProximo.distancia);
    const volumen = mapearDistanciaAVolumen(objetoProximo.distancia);
    // Determina timbre según tipo de objeto (si aplica)
    const timbre = mapearTipoATimbre(objetoProximo.tipo);
    // Actualiza el audio espacializado
    actualizarAudioEspacial({
      posicion: objetoProximo.posicion,
      pitch,
      tempo,
      volumen,
      timbre,
    });
  }, [objetoProximo]);
}

function mapearDistanciaAPitch(distancia: number) {
  // Pitch sube al acercarse (rango 300-1200 Hz)
  return 1200 - Math.min(Math.max(distancia, 0), 2) * 450;
}
function mapearDistanciaATempo(distancia: number) {
  // Tempo más rápido al acercarse (rango 1-5 Hz)
  return 5 - Math.min(Math.max(distancia, 0), 2) * 2;
}
function mapearDistanciaAVolumen(distancia: number) {
  // Volumen mínimo 0.1, máximo 0.7
  return 0.7 - Math.min(Math.max(distancia, 0), 2) * 0.3;
}
function mapearTipoATimbre(tipo?: string) {
  // Ejemplo: diferentes timbres para distintos objetos
  switch (tipo) {
    case 'persona': return 'triangle';
    case 'pared': return 'square';
    case 'puerta': return 'sawtooth';
    default: return 'sine';
  }
}

// actualizarAudioEspacial debe ajustar oscilador, panner y tempo de beeps según los parámetros
```

- **`actualizarAudioEspacial`** sería una función que ajusta el oscilador, el panner y el tempo de los beeps según los parámetros calculados.
- Puedes extender este patrón para incluir alertas críticas, feedback háptico, o personalización avanzada.

---

## Comportamiento de volumen espacial

- El volumen de cada fuente de sonido es **máximo cuando está cerca del usuario** (centro del círculo) y **casi inaudible cuando está en el borde**.
- Se utiliza una **curva cuadrática** para que la caída de volumen sea progresiva y realista: la intensidad disminuye rápidamente al alejarse del centro, facilitando la percepción espacial.
- Este comportamiento puede ajustarse fácilmente en el código (`useSimuladorAudioEspacial`), permitiendo experimentar con diferentes curvas (lineal, cúbica, etc.) según las necesidades sensoriales del usuario.

---

## Recomendaciones para el desarrollo sensorial y cognitivo

- **Itera con usuarios reales:** Prueba los mapeos y la carga cognitiva con personas ciegas o con baja visión.
- **Incluye un modo tutorial:** Explica los sonidos y permite practicar en entorno seguro.
- **Prepara la arquitectura para feedback multimodal:** Audio + vibración.
- **Documenta los mapeos y permite su ajuste futuro.**

---

> **Recuerda:** El objetivo no es solo detectar obstáculos, sino crear una experiencia sensorial intuitiva, segura y no intrusiva, que se adapte a la neuroplasticidad y preferencias del usuario.
