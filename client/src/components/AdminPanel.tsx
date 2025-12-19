import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000/api';

// --- TYPES ---
interface Match {
  spinner: string;
  receiver: string;
}

interface PendingParticipant {
  id: string;
  name: string;
}

interface AdminData {
  matches: Match[];
  pending: PendingParticipant[];
  completed: number;
  total: number;
}

export default function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado para agregar participante
  const [newName, setNewName] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus en input al abrir
  useEffect(() => {
    if (isOpen && !data && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, data]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/admin/matches`, { password });
      setData(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Acceso denegado');
      } else {
        setError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setData(null);
      setPassword('');
      setError('');
      setNewName('');
      setAddSuccess('');
    }, 300);
  };

  // Agregar nuevo participante
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || addingParticipant) return;

    setAddingParticipant(true);
    setAddSuccess('');
    setError('');

    try {
      const res = await axios.post(`${API_URL}/admin/add-participant`, {
        password,
        name: newName.trim()
      });

      setAddSuccess(`✅ ${res.data.participant.name} agregado (Total: ${res.data.total})`);
      setNewName('');

      // Refrescar datos
      const refreshRes = await axios.post(`${API_URL}/admin/matches`, { password });
      setData(refreshRes.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Error al agregar');
      } else {
        setError('Error de conexión');
      }
    } finally {
      setAddingParticipant(false);
    }
  };

  return (
    <>
      {/* Trigger Button - Discreto en esquina */}
      <button
        onClick={() => setIsOpen(true)}
        className="admin-trigger"
        title="Panel de Administración"
        aria-label="Abrir panel de administración"
      >
        <span className="trigger-icon">🔐</span>
      </button>

      {/* Overlay sutil (solo para cerrar al hacer click fuera) */}
      <div
        className={`admin-overlay ${isOpen ? 'visible' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel Lateral Deslizable */}
      <div
        ref={panelRef}
        className={`admin-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
      >
        {/* Header */}
        <div className="panel-header">
          <h2 id="admin-title">
            <span className="header-icon">🎄</span>
            Panel Admin
          </h2>
          <button className="close-btn" onClick={handleClose} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="panel-content">
          {!data ? (
            // FORMULARIO DE ACCESO
            <form onSubmit={handleSubmit} className="login-form">
              <div className="lock-icon">🔒</div>
              <p className="login-subtitle">
                Área restringida para Elfos Mayores
              </p>

              <div className="input-group">
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña Maestra..."
                  className="admin-input"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="error-alert">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <span className="loading-spinner" />
                ) : (
                  <>
                    <span>🔓</span>
                    Desbloquear
                  </>
                )}
              </button>
            </form>
          ) : (
            // DASHBOARD DE DATOS
            <div className="dashboard">
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card success">
                  <span className="stat-value">{data.completed}</span>
                  <span className="stat-label">Completados</span>
                </div>
                <div className="stat-card warning">
                  <span className="stat-value">{data.pending.length}</span>
                  <span className="stat-label">Pendientes</span>
                </div>
              </div>

              {/* SECCIÓN: Agregar Nuevo Participante */}
              <div className="section add-section">
                <h3 className="section-title add">
                  <span>➕</span>
                  Agregar Participante
                </h3>
                <form onSubmit={handleAddParticipant} className="add-form">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="APELLIDO PATERNO NOMBRE..."
                    className="admin-input add-input"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={addingParticipant || !newName.trim()}
                    className="add-btn"
                  >
                    {addingParticipant ? (
                      <span className="loading-spinner small" />
                    ) : (
                      '🎁 Agregar'
                    )}
                  </button>
                </form>
                {addSuccess && (
                  <div className="success-alert">{addSuccess}</div>
                )}
                {error && data && (
                  <div className="error-alert small">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}
                <p className="add-hint">
                  💡 Los nuevos participantes aparecen inmediatamente sin reiniciar
                </p>
              </div>

              {/* Lista de Asignaciones */}
              <div className="section">
                <h3 className="section-title">
                  <span>📜</span>
                  Asignaciones ({data.matches.length})
                </h3>
                <div className="matches-scroll">
                  {data.matches.length > 0 ? (
                    data.matches.map((m, i) => (
                      <div key={i} className="match-item">
                        <span className="giver" title={m.spinner}>{m.spinner}</span>
                        <span className="arrow">→</span>
                        <span className="receiver" title={m.receiver}>{m.receiver}</span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>🎁</span>
                      No hay asignaciones aún
                    </div>
                  )}
                </div>
              </div>

              {/* Pendientes */}
              {data.pending.length > 0 && (
                <div className="section pending-section">
                  <h4 className="section-title warning">
                    <span>⏳</span>
                    Faltan por girar ({data.pending.length})
                  </h4>
                  <div className="pending-tags">
                    {data.pending.map(p => (
                      <span key={p.id} className="pending-tag" title={p.name}>{p.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ESTILOS */}
      <style>{`
        /* Trigger Button */
        .admin-trigger {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 100;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.6;
        }

        .admin-trigger:hover {
          opacity: 1;
          transform: scale(1.05);
          background: rgba(17, 24, 39, 0.95);
          border-color: rgba(251, 191, 36, 0.3);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .trigger-icon {
          font-size: 1.3rem;
          filter: grayscale(0.3);
          transition: filter 0.3s;
        }

        .admin-trigger:hover .trigger-icon {
          filter: grayscale(0);
        }

        /* Overlay */
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 998;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .admin-overlay.visible {
          opacity: 1;
          visibility: visible;
        }

        /* Panel Lateral */
        .admin-panel {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 100%;
          max-width: 420px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 999;
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.5);
        }

        .admin-panel.open {
          transform: translateX(0);
        }

        /* Header */
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-icon {
          font-size: 1.4rem;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        /* Content */
        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        /* Login Form */
        .login-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-top: 2rem;
        }

        .lock-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.8;
        }

        .login-subtitle {
          color: #94a3b8;
          margin: 0 0 2rem 0;
          font-size: 0.95rem;
        }

        .input-group {
          width: 100%;
          margin-bottom: 1rem;
        }

        .admin-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #f8fafc;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .admin-input::placeholder {
          color: #64748b;
        }

        .admin-input:focus {
          outline: none;
          border-color: rgba(251, 191, 36, 0.5);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
        }

        .error-alert {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .error-alert.small {
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          margin-bottom: 0;
        }

        .success-alert {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 10px;
          color: #6ee7b7;
          font-size: 0.9rem;
          margin-top: 0.75rem;
          text-align: center;
        }

        .error-icon {
          font-size: 1rem;
        }

        .submit-btn {
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border: none;
          border-radius: 12px;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(31, 41, 55, 0.3);
          border-top-color: #1f2937;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-spinner.small {
          width: 16px;
          height: 16px;
          border-width: 2px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Dashboard */
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 1.25rem;
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-card.success .stat-value { color: #34d399; }
        .stat-card.warning .stat-value { color: #fbbf24; }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Sections */
        .section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 14px;
          padding: 1rem;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #fbbf24;
        }

        .section-title.warning {
          color: #fb923c;
        }

        .section-title.add {
          color: #22d3ee;
        }

        /* Add Participant Section */
        .add-section {
          background: rgba(34, 211, 238, 0.05);
          border: 1px solid rgba(34, 211, 238, 0.15);
        }

        .add-form {
          display: flex;
          gap: 0.5rem;
        }

        .add-input {
          flex: 1;
          font-size: 0.85rem;
          padding: 0.75rem 1rem;
          text-transform: uppercase;
        }

        .add-btn {
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          border: none;
          border-radius: 12px;
          color: #0f172a;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s;
        }

        .add-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
        }

        .add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-hint {
          margin: 0.75rem 0 0 0;
          font-size: 0.75rem;
          color: #67e8f9;
          opacity: 0.7;
        }

        .matches-scroll {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .matches-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .matches-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .match-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .match-item:last-child {
          margin-bottom: 0;
        }

        .giver {
          flex: 1;
          color: #cbd5e1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 45%;
        }

        .arrow {
          color: #475569;
          margin: 0 0.5rem;
          flex-shrink: 0;
        }

        .receiver {
          flex: 1;
          text-align: right;
          color: #34d399;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 45%;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        .empty-state span {
          font-size: 2rem;
          opacity: 0.5;
        }

        /* Pending */
        .pending-section {
          background: rgba(251, 146, 60, 0.05);
          border: 1px solid rgba(251, 146, 60, 0.1);
        }

        .pending-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pending-tag {
          padding: 0.35rem 0.75rem;
          background: rgba(251, 146, 60, 0.1);
          border-radius: 20px;
          color: #fdba74;
          font-size: 0.7rem;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Responsive */
        @media (max-width: 450px) {
          .admin-panel {
            max-width: 100%;
          }
          
          .add-form {
            flex-direction: column;
          }
          
          .add-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}