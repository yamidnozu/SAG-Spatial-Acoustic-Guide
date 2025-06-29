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
- `src/pipelines/`: Lógica de procesamiento y ejecución de tareas
- `src/adapters/`: Adaptadores para sensores (mock y reales)
- `src/types/`: Tipos globales y compartidos
- `src/hooks/`: Hooks reutilizables

## Objetivo
Permitir a una persona, usando auriculares y el móvil, detectar obstáculos espaciales mediante audio, configurable entre 1 y 2 metros, y fácilmente adaptable a sensores reales.

---

Este README se actualizará conforme avance el desarrollo.
