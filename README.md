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

## 🎅 Guía: Modo Amigo Secreto (`main`)

Esta es la versión actualmente activa si ves este archivo en esta rama.

### ⚙️ Funcionamiento
1.  **Persistencia**: Si cierras el navegador, los emparejamientos se mantienen (gracias a SQLite).
2.  **Seguridad**: Nadie puede ver quién le tocó a quién, solo el propio participante al girar.
3.  **Música y Efectos**: Panel de control para sonido ambiental navideño.

### 🛠️ Panel de Administración
Incluye un panel administrativo accesible desde la interfaz (busca el icono de candado o herramienta) para:
- **Ver Estado**: Monitorizar quién ya ha girado.
- **Reiniciar Totalmente**: Borrar la base de datos para un nuevo sorteo.
- **Requiere Autenticación**: Contraseña configurada en el servidor (por defecto suele ser `navidad2025` o similar en desarrollo).

**Configuración de Participantes:**
Se gestiona en `server/participants.json` o editando la base de datos si se prefiere.
Formato del JSON:
```json
[
  {"id": "1", "name": "Ana Garcia"},
  {"id": "2", "name": "Carlos Perez"}
]
```

---

## 🕹️ Guía: Modo Rifa (`raffle`)

Para usar la versión de rifa simple de premios, debes cambiar de rama.

### 🔄 Cómo cambiar a esta versión
```bash
git checkout raffle
```

### ⚙️ Características Modo Rifa
- **Sin Backend**: Funciona 100% en el navegador.
- **Panel Secreto (Frontend)**: Botón oculto en la esquina inferior izquierda (🔧) para resetear ganadores locales.
- **Lista Simple**: Se configura en `client/src/data/participants.ts`.

---

## 🚀 Instalación y Ejecución

### Opción A: Docker (Recomendado)
El despliegue es idéntico para ambas ramas.

```bash
docker-compose up -d --build
```
Accede a: `http://localhost:3000`

### Opción B: Desarrollo Local (Rama `main`)

Necesitas correr backend y frontend simultáneamente.

**Terminal 1 (Servidor):**
```bash
cd server
npm install
npm start
```

**Terminal 2 (Cliente):**
```bash
cd client
npm install
npm run dev
```

---

## 🛠️ Stack Tecnológico (`main`)

- **Frontend**: React, Vite, TypeScript, GSAP.
- **Backend**: Node.js, Express.
- **Base de Datos**: SQLite (almacena matches de forma segura).

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama: `git checkout -b feature/mejora`
3. Pull Request

---

<p align="center">
  Hecho con ❤️ para celebrar juntos.
</p>
