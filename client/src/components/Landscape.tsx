import React, { useMemo } from 'react';
import './Landscape.css';

// --- UTILIDAD DE GENERACIÓN DETERMINISTA (Pura) ---
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// --- INTERFACES ---
interface LightData {
  id: number;
  top: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

interface TreeProps {
  id: number;
  left: number;
  scale: number;
  delay: number;
  zIndex: number;
  depth: 'front' | 'middle' | 'back';
  hasLights: boolean;
  hasStar?: boolean;
}

// --- COMPONENTE ESTRELLA ---
const TreeStar = React.memo(() => (
  <div className="tree-star">
    <div className="star-glow" />
    <span className="star-icon">⭐</span>
  </div>
));
TreeStar.displayName = 'TreeStar';

// --- COMPONENTE NIEVE MEJORADA ---
const Snow = React.memo(() => (
  <div className="snow-container">
    <div className="snow-layer layer-1" />
    <div className="snow-layer layer-2" />
    <div className="snow-layer layer-3" />
  </div>
));
Snow.displayName = 'Snow';

// --- COMPONENTE TREE MEJORADO ---
const Tree = React.memo(({ id, left, scale, delay, zIndex, depth, hasLights, hasStar }: TreeProps) => {

  // Generar luces siguiendo la forma del árbol
  const lights: LightData[] = useMemo(() => {
    if (!hasLights) return [];

    const colors = ['red', 'green', 'blue', 'yellow', 'pink', 'white'];
    const result: LightData[] = [];

    // Filas de luces que siguen la forma triangular
    const rows = [
      { top: 22, leftMin: 40, leftMax: 60, count: 1 },
      { top: 35, leftMin: 32, leftMax: 68, count: 2 },
      { top: 50, leftMin: 25, leftMax: 75, count: 3 },
      { top: 65, leftMin: 20, leftMax: 80, count: 4 },
      { top: 82, leftMin: 15, leftMax: 85, count: 4 },
    ];

    let lightId = 0;
    rows.forEach((row) => {
      for (let i = 0; i < row.count; i++) {
        const seedColor = id * 1000 + lightId * 7;
        const seedDelay = id * 2000 + lightId * 13;
        const seedSize = id * 3000 + lightId * 17;
        const seedVar = id * 4000 + lightId * 23;

        const baseLeft = row.count === 1
          ? (row.leftMin + row.leftMax) / 2
          : row.leftMin + (i / (row.count - 1)) * (row.leftMax - row.leftMin);

        const variation = (seededRandom(seedVar) - 0.5) * 6;
        const leftPos = Math.max(row.leftMin, Math.min(row.leftMax, baseLeft + variation));
        const topVariation = (seededRandom(seedVar + 100) - 0.5) * 4;

        result.push({
          id: lightId++,
          top: row.top + topVariation,
          left: leftPos,
          color: colors[Math.floor(seededRandom(seedColor) * colors.length)],
          delay: seededRandom(seedDelay) * 3,
          size: 4 + seededRandom(seedSize) * 3,
        });
      }
    });

    return result;
  }, [id, hasLights]);

  // Generar nieve en las ramas
  const snowPatches = useMemo(() => {
    if (depth === 'back') return [];

    return [
      { id: 1, top: '8%', left: '50%', width: '30px', height: '6px' },
      { id: 2, top: '28%', left: '35%', width: '25px', height: '5px' },
      { id: 3, top: '28%', left: '65%', width: '25px', height: '5px' },
      { id: 4, top: '48%', left: '25%', width: '20px', height: '4px' },
      { id: 5, top: '48%', left: '75%', width: '20px', height: '4px' },
    ];
  }, [depth]);

  return (
    <div
      className={`tree depth-${depth}`}
      style={{
        left: `${left}%`,
        zIndex: zIndex,
        '--scale': scale,
        '--delay': `${delay}s`,
      } as React.CSSProperties}
    >
      {/* Estrella en la punta */}
      {hasStar && <TreeStar />}

      <div className="tree-body">
        {/* Ramas con degradado mejorado */}
        <div className="branch tier-top">
          <div className="branch-highlight" />
        </div>
        <div className="branch tier-middle">
          <div className="branch-highlight" />
        </div>
        <div className="branch tier-bottom">
          <div className="branch-highlight" />
        </div>

        {/* Manchas de nieve en las ramas */}
        {snowPatches.map((patch) => (
          <div
            key={patch.id}
            className="snow-patch"
            style={{
              top: patch.top,
              left: patch.left,
              width: patch.width,
              height: patch.height,
            }}
          />
        ))}

        {/* Luces navideñas */}
        {lights.map((light) => (
          <div
            key={light.id}
            className={`light ${light.color}`}
            style={{
              top: `${light.top}%`,
              left: `${light.left}%`,
              animationDelay: `${light.delay}s`,
              width: `${light.size}px`,
              height: `${light.size}px`,
            }}
          />
        ))}
      </div>

      {/* Tronco mejorado */}
      <div className="trunk">
        <div className="trunk-texture" />
      </div>

      {/* Sombra proyectada */}
      <div className="tree-shadow" />
    </div>
  );
});
Tree.displayName = 'Tree';

// --- COMPONENTE PRINCIPAL ---
export default function Landscape() {
  const trees: TreeProps[] = useMemo(() => [
    // FONDO (Siluetas atmosféricas - con algunas estrellas)
    { id: 1, left: 3, scale: 0.45, delay: 0, zIndex: 1, depth: 'back', hasLights: false, hasStar: true },
    { id: 2, left: 18, scale: 0.55, delay: 1.5, zIndex: 2, depth: 'back', hasLights: false, hasStar: false },
    { id: 3, left: 32, scale: 0.48, delay: 2.5, zIndex: 1, depth: 'back', hasLights: false, hasStar: true },
    { id: 4, left: 52, scale: 0.52, delay: 0.8, zIndex: 1, depth: 'back', hasLights: false, hasStar: false },
    { id: 5, left: 68, scale: 0.58, delay: 1.8, zIndex: 2, depth: 'back', hasLights: false, hasStar: true },
    { id: 6, left: 82, scale: 0.5, delay: 0.3, zIndex: 1, depth: 'back', hasLights: false, hasStar: false },
    { id: 7, left: 95, scale: 0.46, delay: 2.0, zIndex: 1, depth: 'back', hasLights: false, hasStar: true },

    // MEDIO (Con luces y estrellas)
    { id: 8, left: 10, scale: 0.7, delay: 1.2, zIndex: 5, depth: 'middle', hasLights: true, hasStar: true },
    { id: 9, left: 28, scale: 0.65, delay: 0.5, zIndex: 4, depth: 'middle', hasLights: true, hasStar: true },
    { id: 10, left: 48, scale: 0.72, delay: 2.0, zIndex: 5, depth: 'middle', hasLights: true, hasStar: true },
    { id: 11, left: 70, scale: 0.68, delay: 1.0, zIndex: 4, depth: 'middle', hasLights: true, hasStar: true },
    { id: 12, left: 90, scale: 0.75, delay: 2.5, zIndex: 5, depth: 'middle', hasLights: true, hasStar: true },

    // PRIMER PLANO (Todos con luces y estrellas)
    { id: 13, left: -8, scale: 1.15, delay: 0, zIndex: 10, depth: 'front', hasLights: true, hasStar: true },
    { id: 14, left: 15, scale: 0.95, delay: 1.5, zIndex: 9, depth: 'front', hasLights: true, hasStar: true },
    { id: 15, left: 40, scale: 1.0, delay: 2.2, zIndex: 10, depth: 'front', hasLights: true, hasStar: true },
    { id: 16, left: 62, scale: 0.92, delay: 0.8, zIndex: 9, depth: 'front', hasLights: true, hasStar: true },
    { id: 17, left: 85, scale: 1.2, delay: 1.0, zIndex: 10, depth: 'front', hasLights: true, hasStar: true },
  ], []);

  return (
    <div className="landscape-container">
      {/* Atmósfera nocturna */}
      <div className="aurora-glow" />
      <div className="moon">
        <div className="moon-glow" />
        <div className="moon-surface" />
      </div>
      <Snow />

      {/* Estrellas del cielo */}
      <div className="sky-stars">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="sky-star"
            style={{
              left: `${seededRandom(i * 100) * 100}%`,
              top: `${seededRandom(i * 200) * 40}%`,
              animationDelay: `${seededRandom(i * 300) * 4}s`,
              opacity: 0.3 + seededRandom(i * 400) * 0.5,
            }}
          />
        ))}
      </div>

      {/* Colinas con profundidad */}
      <div className="hill hill-far" />
      <div className="hill hill-bg" />
      <div className="hill hill-mid" />

      {/* Bosque */}
      <div className="forest-layer">
        {trees.map((tree) => (
          <Tree key={tree.id} {...tree} />
        ))}
      </div>

      {/* Colina frontal y efectos */}
      <div className="hill hill-fg" />
      <div className="ground-snow" />
      <div className="vignette-overlay" />
      <div className="fog-layer" />
    </div>
  );
}