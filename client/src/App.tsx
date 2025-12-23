import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Snow from './components/Snow';
import Landscape from './components/Landscape';
import RouletteNames, { type RouletteNamesRef } from './components/RouletteNames';
import GiftModal from './components/GiftModal';
import { useBackgroundMusic } from './hooks/useSantaSound';
import { PARTICIPANTS, type Participant } from './data/participants';
import './App.css';

// Key para localStorage
const WINNERS_STORAGE_KEY = 'ruleta-ganadores';
const RESET_PASSWORD = 'navidad2025';

// --- SUBCOMPONENTE: BOTÓN DE MÚSICA ---
function MusicButton({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="music-toggle"
      title={isPlaying ? 'Pausar música' : 'Reproducir música'}
      aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
    >
      <span style={{ fontSize: '1.5rem', filter: isPlaying ? 'drop-shadow(0 0 8px #fbbf24)' : 'none' }}>
        {isPlaying ? '🔊' : '🔇'}
      </span>
      <style>{`
        .music-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
          background: rgba(20, 30, 40, 0.4);
          border: 1px solid rgba(255, 215, 0, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          width: 50px; height: 50px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .music-toggle:hover {
          background: rgba(255, 215, 0, 0.15);
          border-color: rgba(255, 215, 0, 0.8);
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
        }
        .music-toggle:active {
          transform: scale(0.9);
        }
      `}</style>
    </button>
  );
}

// --- COMPONENTE PRINCIPAL ---
function App() {
  const [gameState, setGameState] = useState<'READY' | 'SPINNING' | 'REVEAL'>('READY');
  const [winner, setWinner] = useState<Participant | null>(null);

  // Cargar ganadores de localStorage con inicialización lazy
  const [winners, setWinners] = useState<string[]>(() => {
    const saved = localStorage.getItem(WINNERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Audio state
  const [musicPlaying, setMusicPlaying] = useState(false);

  const rouletteRef = useRef<RouletteNamesRef>(null);

  // Dinámicamente obtener el año
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Hook personalizado de música
  const { playMusic, pauseMusic } = useBackgroundMusic();

  // Guardar ganadores cuando cambian
  useEffect(() => {
    if (winners.length > 0) {
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(winners));
    }
  }, [winners]);

  // Participantes disponibles (excluyendo ganadores)
  const availableParticipants = useMemo(() => {
    return PARTICIPANTS.filter(p => !winners.includes(p.id));
  }, [winners]);

  // Handlers
  const handleMusicToggle = useCallback(() => {
    if (musicPlaying) {
      pauseMusic();
      setMusicPlaying(false);
    } else {
      playMusic(0.2);
      setMusicPlaying(true);
    }
  }, [musicPlaying, playMusic, pauseMusic]);

  // Trigger visual del giro
  const handleSpinClick = useCallback(() => {
    if (availableParticipants.length === 0) {
      alert('¡Ya no hay más participantes disponibles!');
      return;
    }

    if (rouletteRef.current && !rouletteRef.current.isSpinning) {
      // Autoplay música si no está sonando
      if (!musicPlaying) {
        playMusic(0.2);
        setMusicPlaying(true);
      }

      setGameState('SPINNING');
      rouletteRef.current.spin();
    }
  }, [musicPlaying, playMusic, availableParticipants.length]);

  // Callback al terminar el giro visual
  const onSpinFinish = useCallback((winnerParticipant: Participant) => {
    setWinner(winnerParticipant);
    // Agregar a ganadores
    setWinners(prev => [...prev, winnerParticipant.id]);
    setTimeout(() => setGameState('REVEAL'), 600);
  }, []);

  // Reiniciar flujo (solo vuelve a READY, no borra ganadores)
  const reset = useCallback(() => {
    setGameState('READY');
    setWinner(null);
  }, []);

  // Reset con contraseña (borra localStorage)
  const handleResetWithPassword = useCallback(() => {
    const password = prompt('Ingresa la contraseña para reiniciar el sorteo:');
    if (password === RESET_PASSWORD) {
      localStorage.removeItem(WINNERS_STORAGE_KEY);
      setWinners([]);
      alert('✅ Sorteo reiniciado. Todos pueden participar de nuevo.');
    } else if (password !== null) {
      alert('❌ Contraseña incorrecta');
    }
  }, []);

  // --- RENDER ---
  return (
    <>
      {/* CAPAS DE FONDO ATMOSFÉRICO */}
      <div className="grid-overlay" />
      <div className="frost-overlay" />

      {/* ELEMENTOS 3D / ANIMADOS */}
      <Snow />
      <Landscape />

      {/* ELEMENTOS FLOTANTES DE UI */}
      <MusicButton isPlaying={musicPlaying} onToggle={handleMusicToggle} />

      {/* Botón de reset oculto (esquina inferior izquierda) */}
      <button
        onClick={handleResetWithPassword}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.2)',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.7rem',
          zIndex: 100,
        }}
      >
        🔧
      </button>

      <div className="screen-container">

        {/* === VISTA PRINCIPAL: RULETA === */}
        {(gameState === 'READY' || gameState === 'SPINNING') && (
          <div className="split-layout">

            {/* Izquierda: Ruleta Visual con Nombres */}
            <div className="roulette-column">
              <RouletteNames
                ref={rouletteRef}
                availableParticipants={availableParticipants}
                winnerIds={winners}
                onFinish={onSpinFinish}
              />
            </div>

            {/* Derecha: Panel de Control */}
            <div className="controls-column">
              <div className="controls-card">
                <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
                  <span className="title-sub">🎁 Sorteo Navideño {currentYear}</span>
                  <span className="title-main">¡Gana un Premio!</span>
                </h1>

                <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  ¡Gira la ruleta y descubre quién es el afortunado ganador!
                </p>

                <button
                  className="btn giant-btn"
                  onClick={handleSpinClick}
                  disabled={gameState === 'SPINNING' || availableParticipants.length === 0}
                >
                  {gameState === 'SPINNING' ? '🎰 GIRANDO...' : '🎡 GIRAR RULETA'}
                </button>

                <div className="decorative-msg">
                  ✨ ¡Buena suerte a todos! ✨
                </div>

                {!musicPlaying && (
                  <p className="tip-text">
                    🔔 Tip: Activa el sonido arriba a la derecha para la mejor experiencia
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === VISTA: REVEAL (Modal Flotante) === */}
        {gameState === 'REVEAL' && winner && (
          <GiftModal winnerName={winner.name} onClose={reset} />
        )}

      </div>
    </>
  );
}

export default App;