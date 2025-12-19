import { useEffect, useState, useMemo, memo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { type ISourceOptions, MoveDirection, OutMode } from "@tsparticles/engine";

/**
 * ❄️ PREMIUM SNOW EFFECT ❄️
 * 
 * Sistema de nieve ultra-realista con:
 * - 3 capas de profundidad (parallax cinematográfico)
 * - Viento suave con deriva natural
 * - Copos con brillo cristalino
 * - Movimiento orgánico con wobble y tilt
 * - Efecto bokeh para copos cercanos
 */

// Configuración base compartida entre capas
const createSnowLayer = (
  layerConfig: {
    id: string;
    count: number;
    sizeRange: [number, number];
    speedRange: [number, number];
    opacityRange: [number, number];
    drift: number;
    wobbleDistance: number;
    wobbleSpeed: number;
    blur?: boolean;
  }
): ISourceOptions => ({
  fpsLimit: 30, // Reducido para mejor rendimiento
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  interactivity: {
    events: {
      onClick: { enable: false },
      onHover: { enable: false },
      resize: { enable: true },
    },
  },
  particles: {
    // ✨ Color con variaciones sutiles (no solo blanco puro)
    color: {
      value: ["#ffffff", "#f0f8ff", "#e6f2ff", "#faf8ff"],
    },

    // 🌬️ Movimiento realista
    move: {
      direction: MoveDirection.bottom, // Caída hacia abajo
      enable: true,
      outModes: {
        default: OutMode.out,
        top: OutMode.out,
        bottom: OutMode.out,
        left: OutMode.out,
        right: OutMode.out,
      },
      random: false, // Desactivado para evitar partículas estáticas
      speed: { min: layerConfig.speedRange[0], max: layerConfig.speedRange[1] },
      straight: false,
      drift: layerConfig.drift, // Viento suave lateral
      gravity: {
        enable: true,
        acceleration: 0.1, // Gravedad más notoria
      },
    },

    // 📊 Cantidad con densidad adaptativa
    number: {
      density: {
        enable: true,
        width: 1920,
        height: 1080,
      },
      value: layerConfig.count,
    },

    // 💫 Opacidad con animación tipo twinkle
    opacity: {
      value: { min: layerConfig.opacityRange[0], max: layerConfig.opacityRange[1] },
      animation: {
        enable: true,
        speed: 0.8,
        sync: false,
        startValue: "random",
        destroy: "none",
      },
    },

    // ⭕ Forma circular con sombra suave
    shape: { type: "circle" },

    // 📐 Tamaño variable para profundidad
    size: {
      value: { min: layerConfig.sizeRange[0], max: layerConfig.sizeRange[1] },
      // Animación de tamaño deshabilitada para mejor rendimiento
    },

    // 🌀 Wobble para movimiento ondulatorio natural
    wobble: {
      enable: true,
      distance: layerConfig.wobbleDistance,
      speed: { min: layerConfig.wobbleSpeed * 0.5, max: layerConfig.wobbleSpeed },
    },

    // 🔄 Tilt para rotación sutil (copos girando)
    tilt: {
      enable: true,
      direction: "random",
      value: { min: 0, max: 360 },
      animation: {
        enable: true,
        speed: 5,
        sync: false,
      },
    },

    // Sombras deshabilitadas para mejor rendimiento
  },
  detectRetina: true,
});

function Snow() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // 🎭 CAPA 1: Copos lejanos (FONDO) - Pequeños, lentos, sutiles
  const farLayerOptions = useMemo(() => createSnowLayer({
    id: "far",
    count: 40, // Reducido de 80
    sizeRange: [1, 2],
    speedRange: [0.8, 1.2],
    opacityRange: [0.15, 0.35],
    drift: 0.2, // Viento muy suave
    wobbleDistance: 3,
    wobbleSpeed: 3,
  }), []);

  // 🎭 CAPA 2: Copos medios (MEDIO) - Tamaño normal, velocidad media
  const midLayerOptions = useMemo(() => createSnowLayer({
    id: "mid",
    count: 35, // Reducido de 60
    sizeRange: [2, 4],
    speedRange: [1.2, 2],
    opacityRange: [0.4, 0.7],
    drift: 0.3, // Viento suave
    wobbleDistance: 8,
    wobbleSpeed: 6,
  }), []);

  // 🎭 CAPA 3: Copos cercanos (FRENTE) - Grandes, rápidos, blur/bokeh
  const nearLayerOptions = useMemo(() => createSnowLayer({
    id: "near",
    count: 15, // Reducido de 25
    sizeRange: [4, 8],
    speedRange: [2, 3.5],
    opacityRange: [0.5, 0.9],
    drift: 0.5, // Viento moderado
    wobbleDistance: 15,
    wobbleSpeed: 8,
    blur: true,
  }), []);

  if (!init) return null;

  return (
    <>
      {/* Estilos para efectos adicionales */}
      <style>{`
        .snow-layer {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
        }
        
        /* Capa lejana: muy sutil */
        .snow-far {
          z-index: 15;
          opacity: 0.7;
        }
        
        /* Capa media: normal */
        .snow-mid {
          z-index: 20;
        }
        
        /* Capa cercana: efecto bokeh suave */
        .snow-near {
          z-index: 25;
          filter: blur(0.5px);
        }
        
        /* Shimmer effect para brillo cristalino */
        @keyframes snowShimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>

      {/* 🌨️ CAPA LEJANA (Fondo) */}
      <div className="snow-layer snow-far">
        <Particles
          id="snow-far"
          options={farLayerOptions}
        />
      </div>

      {/* 🌨️ CAPA MEDIA */}
      <div className="snow-layer snow-mid">
        <Particles
          id="snow-mid"
          options={midLayerOptions}
        />
      </div>

      {/* 🌨️ CAPA CERCANA (Frente - Bokeh) */}
      <div className="snow-layer snow-near">
        <Particles
          id="snow-near"
          options={nearLayerOptions}
        />
      </div>
    </>
  );
}

// Memo para evitar re-renders cuando el padre cambia de estado
export default memo(Snow);