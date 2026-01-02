# 🎄 Ruleta Navideña Universal

> **La suite definitiva para sorteos navideños** — Dos modos de juego, una experiencia visual inolvidable.

<!-- BADGES -->
[![React](https://img.shields.io/badge/React-19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <img src="client/public/preview.png" alt="Vista Previa de la Ruleta" width="800" onerror="this.src='https://via.placeholder.com/800x400?text=Ruleta+Navideña'"/>
</p>

---

## 📖 Descripción

Este repositorio alberga dos aplicaciones distintas diseñadas para diferentes tipos de eventos navideños. Selecciona la "rama" (version) adecuada según tus necesidades:

| Versión / Rama | Modalidad           | Descripción                                                                                                                            | Ideal para...                                               |
| :------------- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **`main`**     | **🎅 Amigo Secreto** | Sistema completo con Backend y Base de Datos. Garantiza que cada persona tenga un "amigo secreto" único sin revelar la lista completa. | Intercambios de regalos anónimos en oficinas o familias.    |
| **`raffle`**   | **🎁 Gran Rifa**     | Aplicación Frontend (sin servidor). Sortea ganadores aleatorios de una lista pública de participantes.                                 | Sortear premios (cestas, bonos) entre todos los asistentes. |

---

## �️ Guía: Modo Rifa (`raffle`)

Esta es la versión actualmente activa si ves este archivo. Es perfecta para sorteos rápidos y visuales.

### ⚙️ Configuración de Participantes

Para añadir o quitar nombres de la ruleta, edita el archivo de configuración:
**Archivo:** `client/src/data/participants.ts`

```typescript
export const PARTICIPANTS = [
  { id: '1', name: 'Ana Garcia' },
  { id: '2', name: 'Carlos Perez' },
  { id: '3', name: 'Maria Rodriguez' },
  // ... añade tantos como necesites
];
```
*No requiere reiniciar nada complejo, la aplicación detectará los cambios automáticamente o al refrescar.*

### 🔧 Panel Secreto y Reinicio

La aplicación guarda localmente quiénes ya ganaron para no repetir premios. Si necesitas empezar de cero o corregir algo:

1.  **Localizar el Botón Secreto**: Busca un pequeño icono de herramienta (🔧) translúcido en la **esquina inferior izquierda** de la pantalla.
2.  **Activar**: Haz clic en él.
3.  **Contraseña**: Introduce la clave maestra de administrador.
    *   **Contraseña por defecto:** `navidad2025`
4.  **Acción**: Esto borrará la memoria de ganadores y permitirá que todos participen nuevamente.

---

## 🎅 Guía: Modo Amigo Secreto (`main`)

Para usar esta versión, debes cambiar de rama.

### 🔄 Cómo cambiar a esta versión
```bash
git checkout main
```

### ⚙️ Funcionamiento
Esta versión utiliza un servidor Node.js y una base de datos SQLite para:
1.  **Persistencia**: Si cierras el navegador, los emparejamientos se mantienen.
2.  **Seguridad**: Nadie puede ver quién le tocó a quién, solo el propio participante al girar.

### 🛠️ Panel de Administración
La versión `main` incluye un panel administrativo (`<AdminPanel />`) accesible desde la interfaz (busca el icono de candado o herramienta similar) para:
- Ver el estado de los emparejamientos.
- Reiniciar el sorteo globalmente (borrar base de datos).
- Requiere autenticación (misma lógica de contraseñas configurada en el servidor).

**Configuración de Participantes (`main`):**
Se realiza en `server/participants.json` o mediante la API si está habilitada.

---

## � Instalación y Ejecución

### Opción A: Docker (Recomendado para Producción)
Funciona en ambas ramas.

```bash
docker-compose up -d --build
```
Accede a: `http://localhost:3000`

### Opción B: Desarrollo Local

**1. Para Modo Rifa (`raffle`)**:
```bash
cd client
npm install
npm run dev
```

**2. Para Modo Amigo Secreto (`main`)**:
Necesitas correr backend y frontend.
```bash
# Terminal 1 (Servidor)
cd server
npm install
npm start

# Terminal 2 (Cliente)
cd client
npm install
npm run dev
```

---

## 🤝 Contribuir

Si quieres mejorar las animaciones o añadir música nueva:
1.  Haz Fork del repositorio.
2.  Crea tu rama (`git checkout -b feature/nueva-musica`).
3.  Envía tu Pull Request.

---

<p align="center">
  Hecho con ❤️ para celebrar juntos.
</p>
