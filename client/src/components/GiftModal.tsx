import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';

// --- UTILIDAD: ALEATORIEDAD DETERMINISTA (Pura) ---
// Evita saltos visuales al hidratar y errores de hooks puros
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

interface GiftModalProps {
  winnerName: string;
  onClose: () => void;
}

const CHRISTMAS_SYMBOLS = ['🎁', '🌟', '❄️', '🎄', '🦌', '✨'];

export default function GiftModal({ winnerName, onClose }: GiftModalProps) {
  // Estado para controlar la hidratación (portal) y la visibilidad (animaciones)
  const [canRender, setCanRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // --- FIX 1: Hydration / Portal Safe Check ---
  // Usamos setTimeout para evitar el error "SetState in Effect synchronously"
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // --- CONFIGURACIÓN DE PARTÍCULAS DE FONDO ---
  // Calculado una sola vez con random determinista para performance extrema
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      const seed1 = i * 111;
      const seed2 = i * 222;
      const seed3 = i * 333;
      const seed4 = i * 444;

      return {
        id: i,
        char: CHRISTMAS_SYMBOLS[i % CHRISTMAS_SYMBOLS.length],
        left: seededRandom(seed1) * 100,            // Posición 0-100%
        animDuration: 4 + seededRandom(seed2) * 4,  // Velocidad variable
        delay: seededRandom(seed3) * 2,             // Delay orgánico
        scale: 0.5 + seededRandom(seed4) * 1.5,     // Tamaños variados
      };
    });
  }, []);

  // --- SECUENCIA DE ENTRADA Y CONFETI ---
  useEffect(() => {
    if (!canRender) return;

    // 1. Iniciar transición CSS (Fade In + Zoom)
    // requestAnimationFrame asegura que el navegador ha pintado el DOM antes de añadir la clase 'visible'
    requestAnimationFrame(() => setIsVisible(true));

    // 2. DETONAR CONFETI REAL (Canvas Confetti) 🎉
    const duration = 3000;
    const end = Date.now() + duration;

    // Función de bucle para lanzar confeti lateral
    const fireSideCannons = () => {
      // Cañón Izquierdo
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ffd700', '#c41e3a', '#ffffff'],
        zIndex: 10000
      });
      // Cañón Derecho
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ffd700', '#c41e3a', '#ffffff'],
        zIndex: 10000
      });

      if (Date.now() < end) {
        requestAnimationFrame(fireSideCannons);
      }
    };

    // Iniciar cañones laterales
    fireSideCannons();

    // 3. Explosión Central Mayor (Golpe de efecto al aparecer el nombre)
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        zIndex: 10001,
        disableForReducedMotion: true,
        colors: ['#ffd700', '#ffffff', '#FF0000']
      });
    }, 400);

  }, [canRender]);

  const handleClose = () => {
    setIsVisible(false); // Disparar animación de salida CSS
    setTimeout(onClose, 500); // Esperar a que termine para desmontar
  };

  // --- RENDER ---
  // Retornamos null si no estamos listos o no hay window (Server side)
  if (!canRender || typeof document === 'undefined') return null;

  // Renderizamos directamente en el body para evitar problemas de Z-Index/Overflow
  return createPortal(
    <div
      className={`modal-backdrop ${isVisible ? 'visible' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Fondo de Partículas Flotantes */}
      <div className="particles-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="floating-particle"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.scale}rem`,
              animationDuration: `${p.animDuration}s`,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties}
          >
            {p.char}
          </div>
        ))}
      </div>

      {/* 2. Tarjeta del Modal (Glassmorphism) */}
      <div
        className={`modal-card ${isVisible ? 'scale-in' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luz ambiental detrás de la tarjeta */}
        <div className="glow-spotlight" />

        {/* Encabezados */}
        <h1 className="congrats-text">¡FELICIDADES!</h1>
        <p className="subtitle-text">La magia de la navidad ha elegido a:</p>

        {/* Nombre del Ganador */}
        <div className="winner-box">
          <div className="gift-bounce-icon">🎁</div>
          <h2 className="winner-name">{winnerName}</h2>
        </div>

        {/* Botón de cierre discreto */}
        <button className="close-hint" onClick={handleClose}>
          Continuar
        </button>
      </div>

      {/* 3. Estilos encapsulados (CSS-in-JS style tag) */}
      <style>{`
        /* --- LAYOUT Y FONDO --- */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(5, 10, 16, 0.7);
          backdrop-filter: blur(15px); /* Desenfoque "Frosted Glass" */
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.4s ease-out;
          overflow: hidden;
        }
        .modal-backdrop.visible {
          opacity: 1;
        }

        /* --- PARTÍCULAS CSS (Fondo) --- */
        .particles-container { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .floating-particle {
          position: absolute; bottom: -10vh; opacity: 0;
          animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

        /* --- TARJETA --- */
        .modal-card {
          position: relative; z-index: 10;
          background: rgba(20, 30, 45, 0.65);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 32px;
          padding: 3rem 2rem;
          text-align: center;
          width: 90%; max-width: 550px;
          /* Sombra de alta calidad */
          box-shadow: 
            0 25px 50px -12px rgba(0,0,0,0.6),
            0 0 30px rgba(255, 215, 0, 0.1);
          /* Estado inicial animación */
          transform: scale(0.9) translateY(20px);
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .modal-card.scale-in {
          transform: scale(1) translateY(0);
        }

        .glow-spotlight {
          position: absolute; top: -50%; left: 50%;
          transform: translateX(-50%);
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
          filter: blur(50px); z-index: -1;
        }

        /* --- TIPOGRAFÍA Y CONTENIDO --- */
        .congrats-text {
          font-family: var(--font-display);
          font-size: clamp(3rem, 10vw, 4.5rem);
          margin: 0;
          line-height: 1.1;
          /* Texto Metálico Dorado */
          background: linear-gradient(180deg, #fffbeb 0%, #fbbf24 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 0 rgba(0,0,0,0.3));
        }

        .subtitle-text {
          color: rgba(241, 245, 249, 0.8);
          font-family: var(--font-hand);
          font-size: 1.5rem;
          margin-top: 0.5rem;
        }

        .winner-box { margin: 2rem 0; }
        
        .winner-name {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 8vw, 4rem);
          color: white;
          text-shadow: 0 4px 0 #9f1239, 0 10px 20px rgba(0,0,0,0.4);
          margin: 0.5rem 0;
          animation: heartBeat 2s infinite;
          line-height: 1;
        }

        .gift-bounce-icon {
          font-size: 4rem;
          filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.4));
          animation: bounce 1.5s infinite;
        }

        .close-hint {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          padding: 0.8rem 2.5rem;
          border-radius: 50px;
          cursor: pointer;
          font-family: var(--font-body);
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 2px;
          transition: all 0.2s;
        }
        .close-hint:hover {
          background: rgba(255, 215, 0, 0.15);
          border-color: rgba(255, 215, 0, 0.5);
          color: white;
          transform: translateY(-2px);
        }

        @keyframes bounce { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-10px); } 
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.05); }
          28% { transform: scale(1); }
          42% { transform: scale(1.05); }
          70% { transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}