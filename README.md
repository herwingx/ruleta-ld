# Secret Santa Roulette 🎅

A high-performance, visually stunning web-based roulette for your office Christmas gift exchange.

## Features
- **Secret & Secure**: Backend logic ensures each spinner gets a unique match, persisisted in SQLite. Matches are not revealed until the spin.
- **Christmas Aesthetic**: Deep red, forest green, gold accents, and falling snow (tsparticles).
- **Cinematic Experience**: Fullscreen API, GSAP animations, and a gift reveal modal.
- **Docker Ready**: Multi-stage Dockerfile and Docker Compose setup compatible with Nginx Proxy Manager.

## Quick Start (Docker)

1. **Configure Network (Optional)**
   Open `docker-compose.yml` and adjust the `networks` section to match your Nginx Proxy Manager network name (e.g., `nginx_proxy_manager_default`).

2. **Run**
   ```bash
   docker-compose up -d --build
   ```

3. **Access**
   Open `http://localhost:3000` (or your configured local domain).

## Configuration

- **Participants**: Edit `server/participants.json` to add your team members before starting.
  Format: `[{"id": "1", "name": "Name"}, ...]`

## Tech Stack
- **Frontend**: Vite + React + TypeScript, GSAP (Animation), tsparticles (Snow).
- **Backend**: Node.js + Express, SQLite (Persistence).
- **Styling**: Vanilla CSS (CSS Modules compatible).

## Development

- Client: `cd client && npm run dev`
- Server: `cd server && npm start`
