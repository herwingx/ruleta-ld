import { useState, useEffect, useMemo, useRef } from 'react';
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

// Tiempo en ms antes de revelar el nombre (cuando la música se pone emocionante)
const REVEAL_DELAY = 3000;

export default function GiftModal({ winnerName, onClose }: GiftModalProps) {
  // Estado para controlar la hidratación (portal) y la visibilidad (animaciones)
  const [canRender, setCanRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [nameRevealed, setNameRevealed] = useState(false);

  // Ref para el audio de fanfarrias
  const fanfarriasRef = useRef<HTMLAudioElement | null>(null);

  // --- FIX 1: Hydration / Portal Safe Check ---
  // Usamos setTimeout para evitar el error "SetState in Effect synchronously"
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRender(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // --- CONFIGURACIÓN DE PARTÍCULAS DE FONDO (Optimizado) ---
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const seed1 = i * 111;
      const seed2 = i * 222;
      const seed3 = i * 333;
      const seed4 = i * 444;

      return {
        id: i,
        char: CHRISTMAS_SYMBOLS[i % CHRISTMAS_SYMBOLS.length],
        left: seededRandom(seed1) * 100,
        animDuration: 5 + seededRandom(seed2) * 3,
        delay: seededRandom(seed3) * 2,
        scale: 0.8 + seededRandom(seed4) * 1,
      };
    });
  }, []);

  // --- SECUENCIA DE ENTRADA: FANFARRIAS + REVELACIÓN AUTOMÁTICA ---
  useEffect(() => {
    if (!canRender) return;

    requestAnimationFrame(() => setIsVisible(true));

    // 1. Iniciar audio de fanfarrias inmediatamente
    fanfarriasRef.current = new Audio('/sounds/fanfarrias.mp3');
    fanfarriasRef.current.volume = 0.6;
    fanfarriasRef.current.play().catch(e => console.log('Audio no pudo reproducirse:', e));

    // 2. Después de 3 segundos, revelar el nombre automáticamente
    const revealTimer = setTimeout(() => {
      setNameRevealed(true);
    }, REVEAL_DELAY);

    return () => {
      clearTimeout(revealTimer);
      if (fanfarriasRef.current) {
        fanfarriasRef.current.pause();
        fanfarriasRef.current = null;
      }
    };
  }, [canRender]);

  // --- CONFETI: Se dispara cuando se revela el nombre ---
  useEffect(() => {
    if (!nameRevealed) return;

    // 1. Gran explosión central al revelar
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5, x: 0.5 },
      zIndex: 10001,
      colors: ['#ffd700', '#ffffff', '#dc2626', '#22c55e', '#fbbf24']
    });

    // 2. Explosión de estrellas
    const starsExplosion = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6, x: 0.5 },
        zIndex: 10001,
        shapes: ['star'],
        colors: ['#ffd700', '#fef3c7', '#fbbf24']
      });
    }, 300);

    // 3. Confeti lateral continuo extendido (para coincidir con la duración del audio)
    let count = 0;
    const sideInterval = setInterval(() => {
      count++;
      // Más iteraciones para que dure más (50 iteraciones * 150ms = ~7.5 segundos)
      if (count > 50) {
        clearInterval(sideInterval);
        return;
      }
      // Cañón Izquierdo
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ffd700', '#dc2626', '#22c55e'],
        zIndex: 10000
      });
      // Cañón Derecho
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ffd700', '#dc2626', '#22c55e'],
        zIndex: 10000
      });
    }, 150);

    // 4. Explosiones adicionales durante la celebración
    const explosion2 = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.7 },
        zIndex: 10001,
        colors: ['#ffd700', '#ffffff', '#dc2626']
      });
    }, 1500);

    const explosion3 = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5, x: 0.3 },
        zIndex: 10001,
        colors: ['#ffd700', '#22c55e', '#fbbf24']
      });
    }, 3000);

    const explosion4 = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5, x: 0.7 },
        zIndex: 10001,
        colors: ['#dc2626', '#ffffff', '#fbbf24']
      });
    }, 4500);

    // 5. Explosión final grande
    const finalExplosion = setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 140,
        origin: { y: 0.6 },
        zIndex: 10001,
        colors: ['#ffd700', '#ffffff', '#dc2626', '#22c55e']
      });
    }, 6000);

    return () => {
      clearTimeout(starsExplosion);
      clearTimeout(explosion2);
      clearTimeout(explosion3);
      clearTimeout(explosion4);
      clearTimeout(finalExplosion);
      if (sideInterval) clearInterval(sideInterval);
    };
  }, [nameRevealed]);

  const handleClose = () => {
    setIsVisible(false); // Disparar animación de salida CSS
    // Detener audio de fanfarrias
    if (fanfarriasRef.current) {
      fanfarriasRef.current.pause();
      fanfarriasRef.current = null;
    }
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

        {/* Contenido según el estado de revelación */}
        {!nameRevealed ? (
          <>
            {/* Estado: Esperando revelación */}
            <h1 className="congrats-text suspense">¡TENEMOS UN GANADOR!</h1>
            <p className="subtitle-text">🎄 Prepárense... 🎄</p>

            <div className="gift-suspense-container">
              <div className="gift-glow" />
              <div className="gift-shake-icon">🎁</div>
              <p className="suspense-hint">El premio está por revelarse...</p>
            </div>
          </>
        ) : (
          <>
            {/* Estado: Nombre revelado */}
            <h1 className="congrats-text revealed">¡FELICIDADES!</h1>
            <p className="subtitle-text">🏆 ¡El ganador del premio es! 🏆</p>

            {/* Nombre del Ganador */}
            <div className="winner-box">
              <div className="gift-bounce-icon">🎁</div>
              <h2 className="winner-name">{winnerName}</h2>
            </div>

            {/* Botón de cierre */}
            <button className="close-hint" onClick={handleClose}>
              Continuar
            </button>
          </>
        )}
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

        /* --- ESTADO DE SUSPENSE (antes de revelar) --- */
        .congrats-text.suspense {
          font-size: clamp(2rem, 7vw, 3rem);
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .congrats-text.revealed {
          animation: revealPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .gift-suspense-container {
          position: relative;
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .gift-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%);
          filter: blur(40px);
          animation: glowPulse 2s ease-in-out infinite;
          z-index: -1;
        }

        .gift-shake-icon {
          font-size: 6rem;
          filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.5));
          animation: shake 0.5s ease-in-out infinite, scalePulse 2s ease-in-out infinite;
        }

        .suspense-hint {
          color: rgba(255, 255, 255, 0.7);
          font-family: var(--font-hand);
          font-size: 1.2rem;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }

        @keyframes scalePulse {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.1) rotate(3deg); }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes revealPop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .winner-name {
          animation: heartBeat 2s infinite, revealSlide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes revealSlide {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}