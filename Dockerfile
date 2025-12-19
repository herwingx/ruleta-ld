# Stage 1: Build Client
FROM node:20-slim AS builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-slim

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./
# Copy built static files from Stage 1 to server's public folder
COPY --from=builder /app/client/dist ./public

# Create empty DB file if not exists (will be volume mounted anyway)
# But useful for structure
RUN touch santa.db

EXPOSE 3000

CMD ["node", "server.js"]
