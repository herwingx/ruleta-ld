import { useRef, useState, useCallback, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useSantaSound } from '../hooks/useSantaSound';
import { PARTICIPANTS, getShortName, type Participant } from '../data/participants';

interface RouletteNamesProps {
  availableParticipants: Participant[]; // Participantes que aún no han ganado
  winnerIds: string[]; // IDs de los que ya ganaron (para marcar en gris)
  onFinish: (winner: Participant) => void;
}

export interface RouletteNamesRef {
  spin: () => void;
  isSpinning: boolean;
}

// 🎨 Paleta Premium Navideña - Colores alternados para los 34 segmentos
const WHEEL_COLORS = [
  '#dc2626', '#065f46', '#d97706', '#059669',
  '#b91c1c', '#0d9488', '#ea580c', '#15803d',
  '#be123c', '#0e7490', '#c2410c', '#047857',
  '#991b1b', '#166534', '#92400e', '#0f766e',
  '#dc2626', '#065f46', '#d97706', '#059669',
  '#b91c1c', '#0d9488', '#ea580c', '#15803d',
  '#be123c', '#0e7490', '#c2410c', '#047857',
  '#991b1b', '#166534', '#92400e', '#0f766e',
  '#dc2626', '#065f46', // 34 colores
];

// 🎅 Frases navideñas festivas
const SANTA_MESSAGES = [
  { text: 'HO HO HO!', emoji: '🎅' },
  { text: '¡NAVIDAD!', emoji: '🎄' },
  { text: '¡FELICIDADES!', emoji: '🎁' },
  { text: '¡MAGIA!', emoji: '✨' },
  { text: '¡NOCHE BUENA!', emoji: '🌟' },
  { text: '¡JO JO JO!', emoji: '🦌' },
  { text: '¡REGALO!', emoji: '🎀' },
  { text: '¡FIESTA!', emoji: '🎉' },
];

const SANTA_COLORS = [
  { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)', glow: 'rgba(251, 191, 36, 0.6)', border: '#fcd34d' },
  { bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)', glow: 'rgba(34, 197, 94, 0.6)', border: '#4ade80' },
  { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)', glow: 'rgba(239, 68, 68, 0.6)', border: '#f87171' },
  { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)', glow: 'rgba(139, 92, 246, 0.6)', border: '#a78bfa' },
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
  x: number;
  y: number;
  size: number;
  delay: number;
  angle: number;
  distance: number;
  emoji: string;
  color: string;
}

const STAR_EMOJIS = ['✨', '⭐', '🌟', '✨', '💫', '✨'];
const STAR_COLORS = ['#fbbf24', '#fcd34d', '#ffffff', '#fef3c7', '#f59e0b'];

const RouletteNames = forwardRef<RouletteNamesRef, RouletteNamesProps>(({ availableParticipants, winnerIds, onFinish }, ref) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hohoItems, setHohoItems] = useState<HoHoItem[]>([]);
  const [sparkles, setSparkles] = useState<SparkleItem[]>([]);
  const [intensity, setIntensity] = useState(0);
  const { playSound, stopAll, getSoundDuration } = useSantaSound();
  const [wheelSize, setWheelSize] = useState(500);

  const hohohoActiveRef = useRef(false);
  const spinTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const numSegments = PARTICIPANTS.length; // 34 segmentos
  const segAngle = 360 / numSegments;

  // Responsive sizing - más grande para mostrar nombres
  useEffect(() => {
    const handleResize = () => {
      const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.75, 700);
      setWheelSize(Math.max(450, maxSize));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto de estrellas alrededor de la ruleta
  useEffect(() => {
    if (!isSpinning) {
      setSparkles([]);
      return;
    }

    const interval = setInterval(() => {
      const newSparkles: SparkleItem[] = [];
      // Crear 4 estrellas en posiciones aleatorias alrededor del borde
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * 360;
        // Radio un poco más grande que la ruleta
        const radius = (wheelSize / 2) + 40 + Math.random() * 30;
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;

        newSparkles.push({
          id: Date.now() + i + Math.random(),
          x,
          y,
          angle,
          distance: 0,
          size: 20 + Math.random() * 16,
          delay: Math.random() * 0.1,
          emoji: STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)],
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        });
      }
      setSparkles(prev => [...prev.slice(-30), ...newSparkles]);
    }, 120);

    return () => clearInterval(interval);
  }, [isSpinning, wheelSize]);

  // HOHOHO trigger mejorado - distribución más equilibrada
  const triggerHoHoHo = useCallback(() => {
    if (hohohoActiveRef.current) return;
    hohohoActiveRef.current = true;
    playSound('hohoho', 0.7);

    const newItems: HoHoItem[] = [];
    const usedMessages = new Set<number>();

    // Posiciones distribuidas en todas las esquinas y lados
    const positions = [
      // Esquinas superiores
      { left: '5%', top: '8%' },
      { left: '85%', top: '8%' },
      // Lados superiores
      { left: '35%', top: '5%' },
      { left: '60%', top: '5%' },
      // Lados medios
      { left: '3%', top: '45%' },
      { left: '92%', top: '45%' },
      // Esquinas inferiores  
      { left: '8%', top: '82%' },
      { left: '85%', top: '82%' },
      // Centro inferior
      { left: '45%', top: '88%' },
    ];

    // Mezclar posiciones
    const shuffledPositions = [...positions].sort(() => Math.random() - 0.5);

    // Mostrar 6 mensajes (menos pero mejor distribuidos)
    for (let i = 0; i < 6; i++) {
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
        scale: 0.85 + Math.random() * 0.3, // Tamaño más consistente
        rotation: 0,
        delay: i * 0.2, // Aparecen más espaciados
        message: msg.text,
        emoji: msg.emoji,
        colorIndex: i % SANTA_COLORS.length, // Ciclar colores
      });
    }
    setHohoItems(newItems);

    setTimeout(() => {
      setHohoItems([]);
      hohohoActiveRef.current = false;
    }, 3500);
  }, [playSound]);

  // SVG Wheel Segments con NOMBRES
  const wheelSegments = useMemo(() => {
    return PARTICIPANTS.map((participant, i) => {
      const angle = segAngle * i;
      const largeArc = segAngle > 180 ? 1 : 0;
      const x1 = 50 + 50 * Math.cos((Math.PI * (angle - 90)) / 180);
      const y1 = 50 + 50 * Math.sin((Math.PI * (angle - 90)) / 180);
      const x2 = 50 + 50 * Math.cos((Math.PI * (angle + segAngle - 90)) / 180);
      const y2 = 50 + 50 * Math.sin((Math.PI * (angle + segAngle - 90)) / 180);

      const d = `M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`;
      const textAngle = angle + segAngle / 2;

      // Nombre corto para que quepa
      const shortName = getShortName(participant.name);

      // Verificar si ya ganó (marcar en gris)
      const isWinner = winnerIds.includes(participant.id);
      const segmentColor = isWinner ? '#4a5568' : WHEEL_COLORS[i % WHEEL_COLORS.length];
      const textOpacity = isWinner ? 0.4 : 1;

      return (
        <g key={i}>
          <defs>
            <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={segmentColor} stopOpacity="1" />
              <stop offset="100%" stopColor={segmentColor} stopOpacity={isWinner ? 0.5 : 0.7} />
            </linearGradient>
          </defs>
          <path
            d={d}
            fill={`url(#grad-${i})`}
            stroke={isWinner ? 'rgba(100, 100, 100, 0.4)' : 'rgba(255, 215, 0, 0.6)'}
            strokeWidth="0.3"
          />
          {/* Separador */}
          <line
            x1="50" y1="50"
            x2={x1} y2={y1}
            stroke={isWinner ? 'rgba(100, 100, 100, 0.4)' : 'rgba(255, 215, 0, 0.8)'}
            strokeWidth="0.3"
          />
          {/* Nombre del participante */}
          <text
            x="50" y="50"
            fontSize="2.2"
            fontWeight="bold"
            textAnchor="start"
            dominantBaseline="middle"
            fill={isWinner ? 'rgba(255,255,255,0.4)' : 'white'}
            opacity={textOpacity}
            transform={`
              rotate(${textAngle - 90}, 50, 50) 
              translate(15, 0) 
              rotate(0)
            `}
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: 'Arial, sans-serif',
              textDecoration: isWinner ? 'line-through' : 'none',
            }}
          >
            {shortName}
          </text>
        </g>
      );
    });
  }, [segAngle, winnerIds]);

  // Spin Logic
  useImperativeHandle(ref, () => ({
    isSpinning,
    spin: async () => {
      if (isSpinning) return;
      setIsSpinning(true);
      setIntensity(1);

      const spinDuration = await getSoundDuration('spin');
      const animationDuration = Math.max(spinDuration - 0.5, 6);

      playSound('spin', 0.6);

      try {
        // Seleccionar ganador aleatorio SOLO de los disponibles
        if (availableParticipants.length === 0) {
          setIsSpinning(false);
          setIntensity(0);
          return;
        }
        const randomAvailableIndex = Math.floor(Math.random() * availableParticipants.length);
        const winner = availableParticipants[randomAvailableIndex];

        // Encontrar el índice en la rueda completa para la animación
        const winnerIndex = PARTICIPANTS.findIndex(p => p.id === winner.id);

        const targetAngle = winnerIndex * segAngle;

        // Más vueltas para efecto dramático
        const minSpins = 360 * (10 + Math.floor(Math.random() * 3));
        const landingAdjust = 360 - (targetAngle + segAngle / 2);
        const totalRotation = minSpins + landingAdjust;
        const fuzz = (Math.random() - 0.5) * (segAngle * 0.15);

        if (wheelRef.current) {
          if (spinTimelineRef.current) {
            spinTimelineRef.current.kill();
          }

          const currentRotation = gsap.getProperty(wheelRef.current, "rotation") as number || 0;
          const delta = (totalRotation - (currentRotation % 360)) + 360 * 3;

          const tl = gsap.timeline();
          spinTimelineRef.current = tl;

          tl.to(wheelRef.current, {
            rotation: `+=${delta + fuzz}`,
            duration: animationDuration,
            ease: "power3.out",
            onUpdate: function () {
              const progress = this.progress();
              setIntensity(1 - progress * 0.7);

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

  const bezelSize = wheelSize + 30;
  const outerRingSize = wheelSize + 50;
  const lightsRadius = (outerRingSize / 2) + 12; // Radio para las luces

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

      {/* Decorative Lights Ring */}
      <div
        className="lights-ring"
        style={{ width: outerRingSize + 40, height: outerRingSize + 40 }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15) * (Math.PI / 180);
          const x = Math.cos(angle) * lightsRadius;
          const y = Math.sin(angle) * lightsRadius;
          return (
            <div
              key={i}
              className={`ring-light ${isSpinning ? 'active' : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          );
        })}
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
            ? `brightness(${1 + intensity * 0.2}) saturate(${1 + intensity * 0.3})`
            : 'none',
          transition: 'filter 0.3s ease-out'
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="wheel-svg"
        >
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
            <span className="hub-emoji">🎁</span>
          </div>
          <div className="hub-ring" />
        </div>
      </div>

      {/* Star Effects - Estrellas alrededor de la ruleta */}
      <div className="stars-container">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="floating-star"
            style={{
              '--x': `${sparkle.x}px`,
              '--y': `${sparkle.y}px`,
              '--size': `${sparkle.size}px`,
              '--delay': `${sparkle.delay}s`,
              '--color': sparkle.color,
            } as React.CSSProperties}
          >
            {sparkle.emoji}
          </div>
        ))}
      </div>

      {/* HoHoHo Effects Overlay */}
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
                  '--delay': `${item.delay}s`,
                  '--bg': colorStyle.bg,
                  '--glow': colorStyle.glow,
                  '--border': colorStyle.border,
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
              gap: 0.6rem;
              padding: 0.7rem 1.2rem;
              background: var(--bg);
              border-radius: 16px;
              box-shadow: 
                0 10px 40px rgba(0, 0, 0, 0.3),
                0 0 30px var(--glow),
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                inset 0 -2px 0 rgba(0, 0, 0, 0.1);
              transform: scale(0);
              animation: hohoBubblePop 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              animation-delay: var(--delay);
              white-space: nowrap;
              border: 2px solid var(--border, rgba(255, 255, 255, 0.5));
              backdrop-filter: blur(8px);
            }

            .hoho-bubble::before {
              content: '';
              position: absolute;
              top: 4px;
              left: 10px;
              right: 10px;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
              border-radius: 50%;
            }

            .hoho-emoji {
              font-size: clamp(1.4rem, 3vw, 2rem);
              filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2));
              animation: emojiPulse 0.6s ease-in-out infinite;
              animation-delay: calc(var(--delay) + 0.2s);
            }

            .hoho-message {
              font-family: 'Outfit', sans-serif;
              font-weight: 800;
              color: white;
              font-size: clamp(0.9rem, 2vw, 1.3rem);
              text-transform: uppercase;
              letter-spacing: 1px;
              text-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.3),
                0 0 10px rgba(255, 255, 255, 0.3);
            }

            @keyframes hohoBubblePop {
              0% { 
                transform: scale(0) translateY(20px); 
                opacity: 0; 
              }
              15% { 
                opacity: 1; 
                transform: scale(1.15) translateY(0); 
              }
              30% { 
                transform: scale(0.95) translateY(-5px); 
              }
              45% { 
                transform: scale(1) translateY(0); 
              }
              80% { 
                opacity: 1; 
                transform: scale(1) translateY(-20px); 
              }
              100% { 
                transform: scale(0.9) translateY(-80px); 
                opacity: 0; 
              }
            }

            @keyframes emojiPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.15); }
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

        /* Lights Ring Container */
        .lights-ring {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3;
        }

        .ring-light {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #fff 0%, #fcd34d 40%, #f59e0b 100%);
          box-shadow: 
            0 0 8px 3px rgba(251, 191, 36, 0.8),
            0 0 15px 5px rgba(251, 191, 36, 0.5),
            0 0 25px 8px rgba(251, 191, 36, 0.3);
          animation: lightPulse 1s ease-in-out infinite;
        }

        .ring-light:nth-child(odd) {
          background: radial-gradient(circle at 30% 30%, #fff 0%, #ef4444 40%, #dc2626 100%);
          box-shadow: 
            0 0 8px 3px rgba(239, 68, 68, 0.8),
            0 0 15px 5px rgba(239, 68, 68, 0.5),
            0 0 25px 8px rgba(239, 68, 68, 0.3);
          animation-delay: 0.5s;
        }

        .ring-light:nth-child(3n) {
          background: radial-gradient(circle at 30% 30%, #fff 0%, #22c55e 40%, #16a34a 100%);
          box-shadow: 
            0 0 8px 3px rgba(34, 197, 94, 0.8),
            0 0 15px 5px rgba(34, 197, 94, 0.5),
            0 0 25px 8px rgba(34, 197, 94, 0.3);
          animation-delay: 0.25s;
        }

        .ring-light.active {
          animation: lightFlicker 0.1s ease-in-out infinite alternate;
        }

        @keyframes lightPulse {
          0%, 100% { opacity: 0.7; transform: translate(var(--tx, 0), var(--ty, 0)) scale(1); }
          50% { opacity: 1; transform: translate(var(--tx, 0), var(--ty, 0)) scale(1.15); }
        }

        @keyframes lightFlicker {
          from { opacity: 0.6; filter: brightness(0.8); }
          to { opacity: 1; filter: brightness(1.3); }
        }

        /* Bezel (Marco Dorado 3D Premium) */
        .bezel-premium {
          position: absolute;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #92400e, #fbbf24, #b45309, #fcd34d, 
            #78350f, #fbbf24, #92400e, #fcd34d,
            #b45309, #fbbf24, #92400e
          );
          box-shadow: 
            inset 0 6px 12px rgba(255, 255, 255, 0.5),
            inset 0 -6px 12px rgba(0, 0, 0, 0.5),
            0 0 30px rgba(251, 191, 36, 0.4),
            0 10px 40px rgba(0, 0, 0, 0.6);
          z-index: 4;
          border: 3px solid rgba(255, 215, 0, 0.6);
        }

        .bezel-premium::before {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            #d97706, #fef3c7, #b45309, #fef3c7,
            #d97706
          );
          opacity: 0.3;
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
          width: 70px;
          height: 70px;
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
          width: 50px;
          height: 50px;
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
          font-size: 1.8rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .hub-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }

        /* Floating Stars - Estrellas que flotan alrededor */
        .stars-container {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
          z-index: 50;
        }

        .floating-star {
          position: absolute;
          font-size: var(--size);
          left: var(--x);
          top: var(--y);
          transform: translate(-50%, -50%);
          animation: floatStar 1s ease-out forwards;
          animation-delay: var(--delay);
          filter: drop-shadow(0 0 10px var(--color));
        }

        @keyframes floatStar {
          0% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.3) rotate(90deg);
          }
          70% {
            opacity: 1;
            transform: translate(-50%, calc(-50% - 20px)) scale(1) rotate(180deg);
          }
          100% { 
            opacity: 0;
            transform: translate(-50%, calc(-50% - 40px)) scale(0.5) rotate(270deg);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .ring-light {
            width: 8px;
            height: 8px;
          }
          .center-hub {
            width: 50px;
            height: 50px;
          }
          .hub-inner {
            width: 35px;
            height: 35px;
          }
          .hub-emoji {
            font-size: 1.2rem;
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

RouletteNames.displayName = "RouletteNames";

export default RouletteNames;
