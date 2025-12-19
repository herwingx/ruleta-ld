import { useState, useRef, useEffect } from 'react';
// Asegúrate de que los estilos están cargados en tu index.css global o importa un modulo si lo usas.

interface SearchSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchSelect({ options, value, onChange, placeholder = "Buscar..." }: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Referencias para manejo de clics y foco
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  // Función para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, ''); // Elimina marcas diacríticas (acentos)
  };

  // Filtrado optimizado: case-insensitive + accent-insensitive
  const filteredOptions = options.filter(option =>
    normalizeText(option.name).includes(normalizeText(search))
  );

  // 1. Cerrar al hacer clic fuera (Hook pattern simplificado)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(''); // Opcional: limpiar búsqueda al cerrar
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Auto-scroll al abrir si hay selección
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Pequeño delay para permitir renderizado
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div
      ref={containerRef}
      className={`search-select-container ${isOpen ? 'active' : ''}`}
    >
      {/* Botón Principal (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="search-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="search-select-value">
          {selectedOption ? (
            // Uso de fragmento para renderizado condicional limpio
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎁</span>
              {selectedOption.name}
            </span>
          ) : (
            <span className="search-select-placeholder">{placeholder}</span>
          )}
        </span>

        {/* Flecha animada con SVG para nitidez perfecta */}
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="search-select-arrow"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="search-select-dropdown" role="listbox">
          {/* Header de búsqueda fijo arriba */}
          <div className="search-select-search-wrapper">
            <svg
              className="search-select-search-icon"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ opacity: 0.7 }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribir..."
              className="search-select-search"
              autoComplete="off"
            />
          </div>

          {/* Lista Scrollable */}
          <div ref={listRef} className="search-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    role="option"
                    aria-selected={isSelected}
                    className={`search-select-option ${isSelected ? 'selected' : ''}`}
                    title={option.name}
                  >
                    {/* Indicador visual de selección Premium (check dorado o árbol) */}
                    <span className="search-select-option-icon">
                      {isSelected ? '✨' : '🎄'}
                    </span>
                    <span className="search-select-option-name">{option.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="search-select-no-results">
                <span>❄️ No se encontró...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}