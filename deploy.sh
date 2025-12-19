#!/bin/bash

# 🚀 Secret Santa Roulette - Deployment Script
# Target: Ubuntu Server with Docker & Docker Compose

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Iniciando despliegue de Ruleta Secret Santa ===${NC}"

# 1. Verificar dependencias
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: docker no está instalado.${NC}" >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &> /dev/null; then
  echo -e "${RED}Error: docker-compose no está instalado.${NC}" >&2
  exit 1
fi

# 2. Asegurar que los archivos de persistencia existen (evita que Docker cree directorios)
echo -e "${YELLOW}Preparando archivos de base de datos...${NC}"
mkdir -p server
touch server/santa_v2.db
if [ ! -f server/participants.json ]; then
  echo '[]' > server/participants.json
  echo -e "${YELLOW}Advertencia: server/participants.json no existía, se creó uno vacío.${NC}"
fi

# 3. Descargar cambios de Git (opcional, si se está en un repo)
if [ -d .git ]; then
  echo -e "${BLUE}Actualizando código desde Git...${NC}"
  git pull origin main || echo -e "${YELLOW}Git pull falló, continuando con archivos locales...${NC}"
fi

# 4. Construir y levantar contenedores
echo -e "${BLUE}Construyendo imagen y reiniciando contenedores...${NC}"
# Usamos 'docker compose' (v2) o 'docker-compose' (v1)
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker-compose"
fi

$DOCKER_COMPOSE_CMD down
$DOCKER_COMPOSE_CMD up -d --build

# 5. Limpieza de imágenes huérfanas
echo -e "${YELLOW}Limpiando imágenes antiguas...${NC}"
docker image prune -f

# 6. Finalización
echo -e "${GREEN}=============================================== ${NC}"
echo -e "${GREEN}   ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!        ${NC}"
echo -e "${GREEN}   App corriendo en el puerto 3001             ${NC}"
echo -e "${GREEN}=============================================== ${NC}"

# Mostrar logs rápidos
echo -e "${BLUE}Logs recientes:${NC}"
$DOCKER_COMPOSE_CMD logs --tail=20 app
