import { User } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useObjetoProximo } from "../hooks/useObjetoProximo";
import { useSimuladorAudioEspacial } from "../hooks/useSimuladorAudioEspacial";
import "./SimuladorAudioEspacial.css";

// Utilidad para contraste automático (YIQ)
function getContrastYIQ(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substr(0,2),16);
  const g = parseInt(c.substr(2,2),16);
  const b = parseInt(c.substr(4,2),16);
  const yiq = (r*299 + g*587 + b*114) / 1000;
  return yiq >= 128 ? '#222' : '#fff';
}

// 🔸 NUEVO GridSVG con máscara radial
const GridSVG: React.FC<{
  width: number;
  height: number;
  cell?: number; // ← opcional: 36 por defecto
}> = ({ width, height, cell = 36 }) => {
  const lines = [];
  const stroke = 'var(--bp-grid)';

  for (let x = 0; x <= width; x += cell) {
    lines.push(
      <line
        key={'v'+x}
        x1={x} y1={0} x2={x} y2={height}
        stroke={stroke}
        strokeWidth={1.6}
      />,
    );
  }
  for (let y = 0; y <= height; y += cell) {
    lines.push(
      <line
        key={'h'+y}
        x1={0} y1={y} x2={width} y2={y}
        stroke={stroke}
        strokeWidth={1.6}
      />,
    );
  }

  return (
    <svg width={width} height={height}
         style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}>
      <defs>
        {/* gradiente blanco→gris→negro para un desvanecido más suave */}
        <radialGradient id="fadeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="white"  />
          <stop offset="75%" stopColor="#888" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        {/* la máscara “pinta” el rectángulo con el gradiente */}
        <mask id="fadeMask">
          <rect width="100%" height="100%" fill="url(#fadeGrad)" />
        </mask>
      </defs>
      {/* aplicamos la máscara solo a las líneas */}
      <g mask="url(#fadeMask)">{lines}</g>
    </svg>
  );
};

export const SimuladorAudioEspacial: React.FC = () => {
  const {
    fuentes,
    audioIniciado,
    iniciarAudio,
    agregarFuente,
    eliminarUltimaFuente,
    moverFuente,
    iniciarArrastreFuente,
    terminarArrastreFuente,
    objetoProximo,
  } = useSimuladorAudioEspacial();

  useObjetoProximo({ objetoProximo });

  const contenedorRef = useRef<HTMLDivElement>(null);
  const [fuenteArrastrando, setFuenteArrastrando] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 400, height: 400 });
  const [, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  React.useLayoutEffect(() => {
    if (contenedorRef.current) {
      const { width, height } = contenedorRef.current.getBoundingClientRect();
      setSize({ width: Math.round(width), height: Math.round(height) });
    }
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manejo de arrastre
  const iniciarArrastre = useCallback(
    (id: string) => {
      setFuenteArrastrando(id);
      document.body.style.cursor = "grabbing";
      iniciarArrastreFuente(id);
    },
    [iniciarArrastreFuente]
  );

  const terminarArrastre = useCallback(() => {
    if (fuenteArrastrando) {
      terminarArrastreFuente();
    }
    setFuenteArrastrando(null);
    document.body.style.cursor = "";
  }, [fuenteArrastrando, terminarArrastreFuente]);

  const moverArrastre = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!fuenteArrastrando || !contenedorRef.current) return;
      const bounds = contenedorRef.current.getBoundingClientRect();
      let clientX = 0,
        clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      // Coordenadas relativas al centro
      let x = clientX - bounds.left;
      let y = clientY - bounds.top;
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = bounds.width / 2;
      if (dist > radius) {
        // Limitar al borde del círculo
        const angle = Math.atan2(dy, dx);
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }
      // Normalizar a [0,1]
      const normX = x / bounds.width;
      const normY = y / bounds.height;
      moverFuente({
        idFuente: fuenteArrastrando,
        posicion: { x: normX, y: normY },
      });
    },
    [fuenteArrastrando, moverFuente]
  );

  // Listeners globales para arrastre fuera del área
  React.useEffect(() => {
    if (!fuenteArrastrando) return;
    // Adaptar tipos para evitar 'as any' y mantener tipado estricto
    const handleMouseMove = (e: MouseEvent) =>
      moverArrastre(e as unknown as React.MouseEvent);
    const handleMouseUp = () => terminarArrastre();
    const handleTouchMove = (e: TouchEvent) =>
      moverArrastre(e as unknown as React.TouchEvent);
    const handleTouchEnd = () => terminarArrastre();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [fuenteArrastrando, moverArrastre, terminarArrastre]);

  // Eliminar la pantalla de inicio y arrancar el audio automáticamente
  React.useEffect(() => {
    if (!audioIniciado) {
      iniciarAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sim-bg" style={{position:'relative', width: '100vw', height: '100vh', overflow: 'hidden'}}>
      {/* Cuadrícula global sutil */}
      {/* <GridSVG width={windowSize.width} height={windowSize.height} cell={20} /> */}
      <div className="sim-title">
        <h1>Audio Espacial</h1>
        <p>
          <span className="sim-headphones">¡Usa auriculares!</span> Cada fuente
          tiene un timbre único. El tono, volumen y velocidad aumentan con la proximidad.
        </p>
      </div>
      <div id="simulation-controls" className="my-4">
        <button
          className="sim-btn sim-btn-blue"
          onClick={agregarFuente}
          id="add-source-btn"
        >
          Añadir Fuente
        </button>
        <button
          className="sim-btn sim-btn-red"
          onClick={eliminarUltimaFuente}
          id="remove-source-btn"
        >
          Eliminar Última
        </button>
      </div>
      <div id="simulation-wrapper">
        <div id="simulation-container" ref={contenedorRef} style={{position:'relative',background:'none'}}>
          {/* Cuadrícula fuerte solo dentro del círculo */}
          <GridSVG width={size.width * 1.2} height={size.height * 1.2} cell={20} />
          <div id="person">
            <User stroke="var(--bp-accent)" />
          </div>
          {fuentes.map((fuente) => {
            const esArrastrando = fuenteArrastrando === fuente.id;
            const color = fuente.color;
            const textColor = getContrastYIQ(color);
            return (
              <div
                key={fuente.id}
                className={`sound-source${esArrastrando ? " grabbing" : ""}`}
                style={{
                  left: `${fuente.posicion.x * 100}%`,
                  top: `${fuente.posicion.y * 100}%`,
                  backgroundColor: color,
                  color: textColor,
                  boxShadow: `0 0 20px ${color}`,
                  border: `2px solid ${textColor}`,
                }}
                onMouseDown={() => iniciarArrastre(fuente.id)}
                onTouchStart={() => iniciarArrastre(fuente.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
