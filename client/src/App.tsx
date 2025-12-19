import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import Snow from './components/Snow';
import Landscape from './components/Landscape';
import Roulette, { type RouletteRef } from './components/Roulette';
import GiftModal from './components/GiftModal';
import SearchSelect from './components/SearchSelect';
import AdminPanel from './components/AdminPanel';
import { useBackgroundMusic } from './hooks/useSantaSound';
import './App.css';

// Configuración de entorno
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

// Types
interface Participant {
  id: string;
  name: string;
}

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
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); /* Elastic bounce */
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [gameState, setGameState] = useState<'LOGIN' | 'ROULETTE' | 'REVEAL' | 'ALREADY_PLAYED'>('LOGIN');
  const [winner, setWinner] = useState<Participant | null>(null);

  // Audio state
  const [musicPlaying, setMusicPlaying] = useState(false);

  const rouletteRef = useRef<RouletteRef>(null);

  // Dinámicamente obtener el año (Ej. 2025)
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Hook personalizado de música
  const { playMusic, pauseMusic } = useBackgroundMusic();

  // 1. Cargar datos iniciales
  useEffect(() => {
    axios.get(`${API_URL}/participants`)
      .then(res => setParticipants(res.data))
      .catch(err => console.error("Error cargando participantes:", err));
  }, []);

  // 2. Handlers
  const handleUserSelect = useCallback((value: string) => {
    setSelectedUser(value);
  }, []);

  const handleMusicToggle = useCallback(() => {
    if (musicPlaying) {
      pauseMusic();
      setMusicPlaying(false);
    } else {
      playMusic(0.2); // Volumen al 20%
      setMusicPlaying(true);
    }
  }, [musicPlaying, playMusic, pauseMusic]);

  // Verificar estado del usuario (¿Ya jugó?)
  const handleStart = useCallback(async () => {
    if (!selectedUser) return;

    // Autoplay UX: Intentar iniciar música suavemente
    if (!musicPlaying) {
      playMusic(0.2);
      setMusicPlaying(true);
    }

    try {
      const res = await axios.get(`${API_URL}/status/${selectedUser}`);
      const data = res.data;

      if (data.hasPlayed) {
        setGameState('ALREADY_PLAYED');
      } else {
        setGameState('ROULETTE');
      }

      // Modo inmersivo full screen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((e) => console.log("Fullscreen request denied", e));
      }
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response
        ? error.response.data.error
        : "No pudimos conectar con el Polo Norte 📡";
      alert(msg);
    }
  }, [selectedUser, musicPlaying, playMusic]);

  // Lógica de Giro (Llamada a API)
  const spinLogic = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/spin`, { spinnerId: selectedUser });
      const data = res.data;

      if (data.alreadyAssigned) {
        setGameState('ALREADY_PLAYED');
        return null;
      }

      return { id: data.receiverId, name: data.receiverName };
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response
        ? error.response.data.error
        : "Ocurrió un error mágico al girar 🪄. Intenta de nuevo.";
      alert(msg);
      return null;
    }
  }, [selectedUser]);

  // Trigger visual del giro
  const handleSpinClick = useCallback(() => {
    if (rouletteRef.current && !rouletteRef.current.isSpinning) {
      rouletteRef.current.spin();
    }
  }, []);

  // Callback al terminar el giro visual
  const onSpinFinish = useCallback((winnerCtx: Participant) => {
    setWinner(winnerCtx);
    // Transición suave hacia el Modal de Revelación
    setTimeout(() => setGameState('REVEAL'), 600);
  }, []);

  // Reiniciar flujo
  const reset = useCallback(() => {
    setGameState('LOGIN');
    setWinner(null);
    setSelectedUser("");
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
      <AdminPanel />

      <div className="screen-container">

        {/* === VISTA 1: LOGIN (Selección de Usuario) === */}
        {gameState === 'LOGIN' && (
          <div className="centered-layout">
            <h1 className="title">
              <span className="title-sub">🎅 Amigo Secreto {currentYear}</span>
              <span className="title-main">Sorteo Navideño</span>
            </h1>

            <p className="subtitle">Selecciona tu nombre para ingresar:</p>

            <SearchSelect
              options={participants}
              value={selectedUser}
              onChange={handleUserSelect}
              placeholder="Busca tu nombre..."
            />

            <button className="btn" onClick={handleStart} disabled={!selectedUser}>
              PARTICIPAR 🎁
            </button>

            {!musicPlaying && (
              <p className="tip-text">
                🔔 Tip: Activa el sonido arriba a la derecha para la mejor experiencia
              </p>
            )}
          </div>
        )}

        {/* === VISTA 2: RULETA (El Juego) === */}
        {gameState === 'ROULETTE' && (
          <div className="split-layout">

            {/* Izquierda: Ruleta Visual */}
            <div className="roulette-column">
              <Roulette
                ref={rouletteRef}
                participants={participants}
                onSpin={spinLogic}
                onFinish={onSpinFinish}
              />
            </div>

            {/* Derecha: Panel de Control */}
            <div className="controls-column">
              <div className="controls-card">
                <h1 className="title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  ¿Quién será? 🎁
                </h1>

                <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  La ruleta del destino está lista.<br />
                  ¡Gira y descubre a quién regalarás!
                </p>

                <button className="btn giant-btn" onClick={handleSpinClick}>
                  GIRAR RULETA
                </button>

                <div className="decorative-msg">
                  ✨ ¡Buena suerte! ✨
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === VISTA 3: REVEAL (Modal Flotante) === */}
        {/* El componente GiftModal usa Portal, por eso se monta "aquí" lógica pero allá visualmente */}
        {gameState === 'REVEAL' && winner && (
          <GiftModal winnerName={winner.name} onClose={reset} />
        )}

        {/* === VISTA 4: ALREADY PLAYED (Estado Informativo - SIN REVELAR NOMBRE) === */}
        {gameState === 'ALREADY_PLAYED' && (
          <div className="centered-layout">
            <div className="controls-card" style={{ maxWidth: '450px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎅✅</div>

              <h1 className="title" style={{ fontSize: '2rem' }}>¡Ya Participaste!</h1>

              <p className="subtitle" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                Tu giro ya fue registrado anteriormente.<br />
                Recuerda a quién te tocó regalar 🎁
              </p>

              <div style={{
                margin: '1.5rem 0',
                padding: '1.5rem',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                background: 'rgba(5, 30, 20, 0.4)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤫</div>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Por seguridad, el nombre de tu amigo secreto<br />
                  no se muestra aquí.<br />
                  <strong style={{ color: 'var(--color-gold)' }}>
                    ¡Esperamos que lo recuerdes!
                  </strong>
                </p>
              </div>

              <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '2rem' }}>
                Si olvidaste tu asignación, consulta con el organizador.
              </p>

              <button className="btn" onClick={reset} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                VOLVER AL INICIO
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default App;