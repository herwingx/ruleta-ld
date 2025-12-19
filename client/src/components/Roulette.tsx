import { useRef, useState, useCallback, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useSantaSound } from '../hooks/useSantaSound';

interface Participant {
  id: string;
  name: string;
}

interface SpinResult {
  id: string;
  name: string;
}

interface RouletteProps {
  participants: Participant[];
  onSpin: () => Promise<SpinResult | null>;
  onFinish: (winner: Participant) => void;
}

export interface RouletteRef {
  spin: () => void;
  isSpinning: boolean;
}

// 🎨 Paleta Premium Navideña - 24 Segmentos
const WHEEL_SEGMENTS = [
  { color: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', symbol: '🎅', glow: '#dc2626' },
  { color: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)', symbol: '🎁', glow: '#10b981' },
  { color: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', symbol: '🎄', glow: '#fbbf24' },
  { color: 'linear-gradient(135deg, #059669 0%, #047857 100%)', symbol: '⭐', glow: '#34d399' },
  { color: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)', symbol: '🦌', glow: '#ef4444' },
  { color: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', symbol: '⛄', glow: '#2dd4bf' },
  { color: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', symbol: '🍪', glow: '#fb923c' },
  { color: 'linear-gradient(135deg, #15803d 0%, #166534 100%)', symbol: '🔔', glow: '#22c55e' },
  { color: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', symbol: '❄️', glow: '#f87171' },
  { color: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)', symbol: '🎀', glow: '#06b6d4' },
  { color: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)', symbol: '🕯️', glow: '#f97316' },
  { color: 'linear-gradient(135deg, #047857 0%, #065f46 100%)', symbol: '🧦', glow: '#10b981' },
  // Segunda mitad - más variedad
  { color: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)', symbol: '🎶', glow: '#f43f5e' },
  { color: 'linear-gradient(135deg, #166534 0%, #14532d 100%)', symbol: '🌟', glow: '#4ade80' },
  { color: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)', symbol: '🥛', glow: '#fbbf24' },
  { color: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)', symbol: '🎿', glow: '#14b8a6' },
  { color: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)', symbol: '🧣', glow: '#ef4444' },
  { color: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', symbol: '🏠', glow: '#22d3ee' },
  { color: 'linear-gradient(135deg, #b45309 0%, #a16207 100%)', symbol: '🌲', glow: '#f59e0b' },
  { color: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)', symbol: '🎊', glow: '#22c55e' },
  { color: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', symbol: '🧤', glow: '#f87171' },
  { color: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', symbol: '☃️', glow: '#2dd4bf' },
  { color: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)', symbol: '🎉', glow: '#fb923c' },
  { color: 'linear-gradient(135deg, #059669 0%, #047857 100%)', symbol: '✨', glow: '#34d399' },
];

// Colores sólidos para SVG
const WHEEL_COLORS = [
  '#dc2626', '#065f46', '#d97706', '#059669',
  '#b91c1c', '#0d9488', '#ea580c', '#15803d',
  '#dc2626', '#0e7490', '#c2410c', '#047857',
  '#be123c', '#166534', '#92400e', '#0f766e',
  '#991b1b', '#0e7490', '#b45309', '#15803d',
  '#dc2626', '#0d9488', '#c2410c', '#059669',
];

// 🎅 Frases navideñas variadas de Santa
const SANTA_MESSAGES = [
  { text: 'HO HO HO!', emoji: '🎅' },
  { text: '¡FELIZ NAVIDAD!', emoji: '🎄' },
  { text: '¡JINGLE BELLS!', emoji: '🔔' },
  { text: '¡MERRY CHRISTMAS!', emoji: '⭐' },
  { text: '¡REGALOS!', emoji: '🎁' },
  { text: '¡MAGIA!', emoji: '✨' },
  { text: 'HO HO HO!', emoji: '🦌' },
  { text: '¡JO JO JO!', emoji: '🎅' },
];

const SANTA_COLORS = [
  { bg: 'linear-gradient(135deg, #dc2626, #991b1b)', glow: 'rgba(220, 38, 38, 0.8)' },
  { bg: 'linear-gradient(135deg, #15803d, #166534)', glow: 'rgba(21, 128, 61, 0.8)' },
  { bg: 'linear-gradient(135deg, #d97706, #b45309)', glow: 'rgba(217, 119, 6, 0.8)' },
  { bg: 'linear-gradient(135deg, #0891b2, #0e7490)', glow: 'rgba(8, 145, 178, 0.8)' },
];

interface HoHoItem {
  id: number;
  top: string;
  left: string;
  scale: number;
  rotation: number;
  delay: number;
  message: string;
  emoji: string;
  colorIndex: number;
}

interface SparkleItem {
  id: number;
  x: string;
  y: string;
  size: number;
  delay: number;
}

const Roulette = forwardRef<RouletteRef, RouletteProps>(({ onSpin, onFinish }, ref) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hohoItems, setHohoItems] = useState<HoHoItem[]>([]);
  const [sparkles, setSparkles] = useState<SparkleItem[]>([]);
  const [intensity, setIntensity] = useState(0);
  const { playSound, stopAll, getSoundDuration } = useSantaSound();
  const [wheelSize, setWheelSize] = useState(420);

  const hohohoActiveRef = useRef(false);
  const spinTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      const maxSize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.55, 480);
      setWheelSize(Math.max(300, maxSize));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sparkle effect durante el giro
  useEffect(() => {
    if (!isSpinning) {
      setSparkles([]);
      return;
    }

    const interval = setInterval(() => {
      const newSparkles: SparkleItem[] = [];
      for (let i = 0; i < 6; i++) {
        newSparkles.push({
          id: Date.now() + i + Math.random(),
          x: `${Math.random() * 100}%`,
          y: `${Math.random() * 100}%`,
          size: 4 + Math.random() * 10,
          delay: Math.random() * 0.2,
        });
      }
      setSparkles(prev => [...prev.slice(-40), ...newSparkles]);
    }, 100);

    return () => clearInterval(interval);
  }, [isSpinning]);

  // HOHOHO trigger mejorado - Posicionamiento en bordes (evitando centro)
  const triggerHoHoHo = useCallback(() => {
    if (hohohoActiveRef.current) return;
    hohohoActiveRef.current = true;
    playSound('hohoho', 0.7);

    const newItems: HoHoItem[] = [];
    const usedMessages = new Set<number>();

    // Posiciones predefinidas alrededor de la ruleta (bordes y esquinas)
    // Evitamos el centro de la pantalla (aprox 25%-75% horizontal y 20%-80% vertical)
    const edgePositions = [
      // Esquina superior izquierda
      { left: '3%', top: '5%' },
      { left: '15%', top: '8%' },
      // Esquina superior derecha
      { left: '80%', top: '5%' },
      { left: '92%', top: '10%' },
      // Lado izquierdo
      { left: '2%', top: '40%' },
      { left: '5%', top: '60%' },
      // Lado derecho
      { left: '88%', top: '45%' },
      { left: '92%', top: '65%' },
      // Esquina inferior izquierda
      { left: '5%', top: '85%' },
      { left: '18%', top: '90%' },
      // Esquina inferior derecha
      { left: '78%', top: '88%' },
      { left: '90%', top: '85%' },
    ];

    // Mezclar posiciones para variedad
    const shuffledPositions = [...edgePositions].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 8; i++) {
      // Seleccionar mensaje único
      let msgIndex = Math.floor(Math.random() * SANTA_MESSAGES.length);
      while (usedMessages.has(msgIndex) && usedMessages.size < SANTA_MESSAGES.length) {
        msgIndex = Math.floor(Math.random() * SANTA_MESSAGES.length);
      }
      usedMessages.add(msgIndex);

      const msg = SANTA_MESSAGES[msgIndex];
      const position = shuffledPositions[i % shuffledPositions.length];

      newItems.push({
        id: Date.now() + i,
        left: position.left,
        top: position.top,
        scale: 0.6 + Math.random() * 0.5,
        rotation: -20 + Math.random() * 40,
        delay: i * 0.15,
        message: msg.text,
        emoji: msg.emoji,
        colorIndex: Math.floor(Math.random() * SANTA_COLORS.length),
      });
    }
    setHohoItems(newItems);

    setTimeout(() => {
      setHohoItems([]);
      hohohoActiveRef.current = false;
    }, 4500);
  }, [playSound]);

  // SVG Wheel Segments
  const numSegments = WHEEL_SEGMENTS.length;
  const segAngle = 360 / numSegments;

  const wheelSegments = useMemo(() => {
    return WHEEL_SEGMENTS.map((segment, i) => {
      const angle = segAngle * i;
      const largeArc = segAngle > 180 ? 1 : 0;
      const x1 = 50 + 50 * Math.cos((Math.PI * (angle - 90)) / 180);
      const y1 = 50 + 50 * Math.sin((Math.PI * (angle - 90)) / 180);
      const x2 = 50 + 50 * Math.cos((Math.PI * (angle + segAngle - 90)) / 180);
      const y2 = 50 + 50 * Math.sin((Math.PI * (angle + segAngle - 90)) / 180);

      const d = `M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`;
      const textAngle = angle + segAngle / 2;

      return (
        <g key={i}>
          {/* Gradiente definido para cada segmento */}
          <defs>
            <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={WHEEL_COLORS[i]} stopOpacity="1" />
              <stop offset="100%" stopColor={WHEEL_COLORS[i]} stopOpacity="0.7" />
            </linearGradient>
            <filter id={`glow-${i}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={d}
            fill={`url(#grad-${i})`}
            stroke="rgba(255, 215, 0, 0.6)"
            strokeWidth="0.4"
          />
          {/* Separador dorado brillante */}
          <line
            x1="50" y1="50"
            x2={x1} y2={y1}
            stroke="rgba(255, 215, 0, 0.8)"
            strokeWidth="0.5"
          />
          {/* Emoji del símbolo */}
          <text
            x="50" y="50"
            fontSize="5.5"
            textAnchor="middle"
            dominantBaseline="middle"
            filter={`url(#glow-${i})`}
            transform={`
              rotate(${textAngle - 90}, 50, 50) 
              translate(35, 0) 
              rotate(90)
            `}
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))' }}
          >
            {segment.symbol}
          </text>
        </g>
      );
    });
  }, [segAngle]);

  // Spin Logic con sincronización de audio mejorada
  useImperativeHandle(ref, () => ({
    isSpinning,
    spin: async () => {
      if (isSpinning) return;
      setIsSpinning(true);
      setIntensity(1);

      // Obtener duración del audio de spin
      const spinDuration = await getSoundDuration('spin');
      const animationDuration = Math.max(spinDuration - 0.5, 6); // Sync con audio

      playSound('spin', 0.6);

      try {
        const winner = await onSpin();
        if (!winner) {
          stopAll();
          setIsSpinning(false);
          setIntensity(0);
          return;
        }

        const randomTargetIndex = Math.floor(Math.random() * numSegments);
        const targetAngle = randomTargetIndex * segAngle;

        // Más vueltas para efecto más dramático (10-12 vueltas)
        const minSpins = 360 * (10 + Math.floor(Math.random() * 3));
        const landingAdjust = 360 - (targetAngle + segAngle / 2);
        const totalRotation = minSpins + landingAdjust;
        const fuzz = (Math.random() - 0.5) * (segAngle * 0.15);

        if (wheelRef.current) {
          // Matar animación anterior si existe
          if (spinTimelineRef.current) {
            spinTimelineRef.current.kill();
          }

          const currentRotation = gsap.getProperty(wheelRef.current, "rotation") as number || 0;
          const delta = (totalRotation - (currentRotation % 360)) + 360 * 3;

          // Timeline para control más preciso
          const tl = gsap.timeline();
          spinTimelineRef.current = tl;

          // Curva personalizada: Inicia RÁPIDO y desacelera gradualmente
          // Esto coincide con el audio que empieza fuerte
          tl.to(wheelRef.current, {
            rotation: `+=${delta + fuzz}`,
            duration: animationDuration,
            ease: "power3.out", // Empieza rápido, termina lento (coinicide con audio!)
            onUpdate: function () {
              const progress = this.progress();
              setIntensity(1 - progress * 0.7);

              // Trigger HoHoHo en el momento de máxima velocidad (inicio)
              if (progress > 0.1 && progress < 0.3 && Math.random() < 0.08) {
                triggerHoHoHo();
              }
            },
            onComplete: () => {
              stopAll();
              playSound('win', 0.85);
              setTimeout(() => playSound('jingle', 0.6), 300);
              setIsSpinning(false);
              setIntensity(0);
              onFinish(winner);
            }
          });

          // Animación de glow sincronizada
          if (glowRef.current) {
            tl.to(glowRef.current, {
              opacity: 0.3,
              duration: animationDuration,
              ease: "power2.out"
            }, 0);
          }
        }
      } catch (e) {
        console.error('Spin error:', e);
        stopAll();
        setIsSpinning(false);
        setIntensity(0);
      }
    }
  }));

  const bezelSize = wheelSize + 40;
  const outerRingSize = wheelSize + 60;

  return (
    <div className="roulette-premium-wrapper">
      {/* Outer Glow Ring */}
      <div
        ref={glowRef}
        className="outer-glow-ring"
        style={{
          width: outerRingSize + 20,
          height: outerRingSize + 20,
          opacity: isSpinning ? 0.8 : 0.4
        }}
      />

      {/* Decorative Outer Ring with lights */}
      <div
        className="decorative-ring"
        style={{ width: outerRingSize, height: outerRingSize }}
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className={`ring-light ${isSpinning ? 'active' : ''}`}
            style={{
              transform: `rotate(${i * 10}deg) translateY(-${outerRingSize / 2 - 8}px)`,
              animationDelay: `${i * 0.03}s`,
            }}
          />
        ))}
      </div>

      {/* Bezel Ring (Marco dorado) */}
      <div
        className="bezel-premium"
        style={{ width: bezelSize, height: bezelSize }}
      />

      {/* Pointer Arrow (Triángulo fijo) */}
      <div className="pointer-premium">
        <div className="pointer-glow" />
      </div>

      {/* Spinning Wheel */}
      <div
        ref={wheelRef}
        className="wheel-disk"
        style={{
          width: wheelSize,
          height: wheelSize,
          filter: isSpinning
            ? `brightness(${1 + intensity * 0.3}) saturate(${1 + intensity * 0.5}) blur(${intensity * 1.5}px)`
            : 'none',
          transition: 'filter 0.3s ease-out'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="wheel-svg"
        >
          {/* Sombra interior */}
          <defs>
            <filter id="inner-shadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
              <feOffset dx="0" dy="2" result="offsetBlur" />
              <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
            </filter>
          </defs>
          {wheelSegments}
          {/* Círculo decorativo exterior */}
          <circle
            cx="50" cy="50" r="49"
            fill="none"
            stroke="rgba(255, 215, 0, 0.4)"
            strokeWidth="1"
          />
        </svg>

        {/* Center Hub */}
        <div className="center-hub">
          <div className="hub-inner">
            <span className="hub-emoji">🎄</span>
          </div>
          <div className="hub-ring" />
        </div>
      </div>

      {/* Sparkle Effects */}
      <div className="sparkle-container">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="sparkle"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: `${sparkle.delay}s`
            }}
          />
        ))}
      </div>

      {/* HoHoHo Effects Overlay - Renderizado via Portal en body para posición correcta */}
      {hohoItems.length > 0 && createPortal(
        <div className="hoho-overlay">
          {hohoItems.map((item) => {
            const colorStyle = SANTA_COLORS[item.colorIndex];
            return (
              <div
                key={item.id}
                className="hoho-bubble"
                style={{
                  top: item.top,
                  left: item.left,
                  '--scale': item.scale,
                  '--rot': `${item.rotation}deg`,
                  '--delay': `${item.delay}s`,
                  '--bg': colorStyle.bg,
                  '--glow': colorStyle.glow,
                } as React.CSSProperties}
              >
                <span className="hoho-emoji">{item.emoji}</span>
                <span className="hoho-message">{item.message}</span>
              </div>
            );
          })}
          <style>{`
            .hoho-overlay {
              position: fixed;
              inset: 0;
              pointer-events: none;
              z-index: 9999;
              overflow: hidden;
            }

            .hoho-bubble {
              position: absolute;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.8rem 1.5rem;
              background: var(--bg);
              border-radius: 50px;
              box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 40px var(--glow),
                inset 0 2px 0 rgba(255, 255, 255, 0.3);
              transform: rotate(var(--rot)) scale(0);
              animation: hohoBubblePop 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              animation-delay: var(--delay);
              white-space: nowrap;
              border: 3px solid rgba(255, 255, 255, 0.4);
            }

            .hoho-emoji {
              font-size: clamp(1.5rem, 4vw, 2.5rem);
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
              animation: emojiWiggle 0.5s ease-in-out infinite;
              animation-delay: calc(var(--delay) + 0.3s);
            }

            .hoho-message {
              font-family: 'Mountains of Christmas', cursive;
              font-weight: 700;
              color: white;
              font-size: clamp(1.2rem, 3vw, 2rem);
              text-shadow: 
                2px 2px 0 rgba(0, 0, 0, 0.3),
                0 0 20px rgba(255, 255, 255, 0.5);
              letter-spacing: 2px;
            }

            @keyframes hohoBubblePop {
              0% { 
                transform: rotate(var(--rot)) scale(0) translateY(50px); 
                opacity: 0; 
              }
              20% { 
                opacity: 1; 
                transform: rotate(var(--rot)) scale(calc(var(--scale) * 1.3)) translateY(0); 
              }
              35% { 
                transform: rotate(var(--rot)) scale(calc(var(--scale) * 0.9)) translateY(-10px); 
              }
              50% { 
                transform: rotate(var(--rot)) scale(var(--scale)) translateY(-5px); 
              }
              75% { 
                opacity: 1; 
                transform: rotate(var(--rot)) scale(var(--scale)) translateY(-30px); 
              }
              100% { 
                transform: rotate(var(--rot)) scale(calc(var(--scale) * 0.8)) translateY(-120px); 
                opacity: 0; 
              }
            }

            @keyframes emojiWiggle {
              0%, 100% { transform: rotate(-10deg); }
              50% { transform: rotate(10deg); }
            }
          `}</style>
        </div>,
        document.body
      )}

      <style>{`
        .roulette-premium-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6));
        }

        /* Outer Glow */
        .outer-glow-ring {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(251, 191, 36, 0.3) 0%, 
            rgba(220, 38, 38, 0.2) 40%, 
            transparent 70%
          );
          animation: pulseGlow 2s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
          transition: opacity 0.5s ease;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }

        /* Decorative Ring with Lights */
        .decorative-ring {
          position: absolute;
          border-radius: 50%;
          z-index: 1;
        }

        .ring-light {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, #fcd34d 0%, #f59e0b 60%, #d97706 100%);
          box-shadow: 0 0 12px 4px rgba(251, 191, 36, 0.6),
                      0 0 20px rgba(251, 191, 36, 0.4);
          transform-origin: center center;
          opacity: 0.7;
          transition: all 0.3s;
        }

        .ring-light.active {
          animation: lightFlicker 0.15s ease-in-out infinite alternate;
        }

        .ring-light:nth-child(odd) {
          background: radial-gradient(circle, #ef4444 0%, #dc2626 60%, #b91c1c 100%);
          box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.6),
                      0 0 20px rgba(239, 68, 68, 0.4);
        }

        .ring-light:nth-child(3n) {
          background: radial-gradient(circle, #22c55e 0%, #16a34a 60%, #15803d 100%);
          box-shadow: 0 0 12px 4px rgba(34, 197, 94, 0.6),
                      0 0 20px rgba(34, 197, 94, 0.4);
        }

        @keyframes lightFlicker {
          from { opacity: 0.5; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }

        /* Bezel (Marco Dorado 3D) */
        .bezel-premium {
          position: absolute;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #b45309, #fbbf24, #d97706, #f59e0b, 
            #b45309, #fbbf24, #d97706, #f59e0b,
            #b45309
          );
          box-shadow: 
            inset 0 4px 8px rgba(255, 255, 255, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.5);
          z-index: 2;
        }

        /* Pointer Premium */
        .pointer-premium {
          position: absolute;
          top: -5px;
          z-index: 100;
          width: 0;
          height: 0;
          border-left: 22px solid transparent;
          border-right: 22px solid transparent;
          border-top: 55px solid #fefefe;
          filter: drop-shadow(0 4px 0 #b91c1c)
                  drop-shadow(0 8px 4px rgba(0, 0, 0, 0.4));
          animation: pointerBounce 3s ease-in-out infinite;
        }

        .pointer-premium::before {
          content: '';
          position: absolute;
          top: -65px;
          left: -12px;
          width: 24px;
          height: 24px;
          background: radial-gradient(circle, #fcd34d 0%, #f59e0b 70%);
          border-radius: 50%;
          box-shadow: 0 0 20px 6px rgba(251, 191, 36, 0.6);
        }

        .pointer-glow {
          position: absolute;
          top: -40px;
          left: -15px;
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.5), transparent);
          border-radius: 50%;
          animation: pointerGlow 1.5s ease-in-out infinite;
        }

        @keyframes pointerBounce {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }

        @keyframes pointerGlow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        /* Wheel Disk */
        .wheel-disk {
          position: relative;
          border-radius: 50%;
          z-index: 10;
          transition: filter 0.3s ease;
        }

        .wheel-svg {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
        }

        /* Center Hub */
        .center-hub {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            #fef3c7 0%, 
            #fcd34d 30%, 
            #f59e0b 70%, 
            #d97706 100%
          );
          box-shadow: 
            inset 0 4px 8px rgba(255, 255, 255, 0.5),
            inset 0 -4px 8px rgba(0, 0, 0, 0.3),
            0 6px 20px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hub-inner {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            #fff 0%, 
            #fef3c7 30%, 
            #fcd34d 100%
          );
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .hub-emoji {
          font-size: 2rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .hub-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }

        /* Sparkles */
        .sparkle-container {
          position: absolute;
          inset: -50px;
          pointer-events: none;
          z-index: 50;
        }

        .sparkle {
          position: absolute;
          background: white;
          border-radius: 50%;
          animation: sparkleAnim 0.6s ease-out forwards;
          box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8),
                      0 0 20px 4px rgba(251, 191, 36, 0.4);
        }

        @keyframes sparkleAnim {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(180deg); opacity: 0; }
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .ring-light {
            width: 8px;
            height: 8px;
          }
          .center-hub {
            width: 60px;
            height: 60px;
          }
          .hub-inner {
            width: 45px;
            height: 45px;
          }
          .hub-emoji {
            font-size: 1.5rem;
          }
          .pointer-premium {
            border-left: 18px solid transparent;
            border-right: 18px solid transparent;
            border-top: 45px solid #fefefe;
          }
          .pointer-premium::before {
            top: -55px;
            left: -10px;
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
});

Roulette.displayName = "Roulette";

export default Roulette;