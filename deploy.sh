#!/bin/bash

# 🎁 Ruleta Sorteo Navideño - Deployment Script
# Target: Ubuntu Server with Docker

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

APP_PORT=8080
CONTAINER_NAME="ruleta-sorteo"

# Detectar comando docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker-compose"
fi

show_banner() {
  clear
  echo -e "${GREEN}"
  echo "    ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️"
  echo ""
  echo -e "${RED}       🎁 RULETA SORTEO NAVIDEÑO 🎁${NC}"
  echo -e "${GREEN}          Deployment Manager${NC}"
  echo ""
  echo -e "${GREEN}    ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️${NC}"
  echo ""
}

show_menu() {
  echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}    ${BOLD}¿Qué deseas hacer?${NC}                 ${CYAN}║${NC}"
  echo -e "${CYAN}╠════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}1)${NC} 🚀 Desplegar aplicación            ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}2)${NC} 📋 Ver logs en tiempo real         ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}3)${NC} ⏹️  Detener servicios               ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}4)${NC} 📊 Ver estado de contenedores      ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}5)${NC} 🚪 Salir                            ${CYAN}║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
  echo ""
}

interactive_menu() {
  while true; do
    show_banner
    show_menu
    
    echo -ne "${YELLOW}Selecciona una opción [1-5]: ${NC}"
    read -r choice
    
    case $choice in
      1)
        echo ""
        deploy_app
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      2)
        echo ""
        echo -e "${BLUE}Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
        $DOCKER_COMPOSE_CMD logs -f || true
        ;;
      3)
        echo ""
        echo -e "${YELLOW}Deteniendo servicios...${NC}"
        $DOCKER_COMPOSE_CMD down
        echo -e "${GREEN}✓ Servicios detenidos.${NC}"
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      4)
        echo ""
        echo -e "${BLUE}Estado de los contenedores:${NC}"
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo -e "${YELLOW}No hay contenedores activos${NC}"
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      5)
        echo ""
        echo -e "${GREEN}🎄 ¡Feliz Navidad! Hasta pronto... 🎄${NC}"
        echo ""
        exit 0
        ;;
      *)
        echo -e "${RED}Opción no válida. Por favor, selecciona 1-5.${NC}"
        sleep 1
        ;;
    esac
  done
}

deploy_app() {
  echo -e "${BLUE}🎁 === Iniciando despliegue de Ruleta Sorteo === 🎁${NC}"

  # 1. Verificar Docker
  echo -e "${BLUE}[1/4] Verificando dependencias...${NC}"
  if ! [ -x "$(command -v docker)" ]; then
    echo -e "${RED}Error: docker no está instalado.${NC}" >&2
    return 1
  fi
  echo -e "${GREEN}✓ Docker disponible${NC}"

  # 2. Git pull (opcional)
  if [ -d .git ]; then
    echo -e "${BLUE}[2/4] Actualizando código desde Git...${NC}"
    git pull origin main 2>/dev/null || echo -e "${YELLOW}⚠ Git pull falló, continuando con archivos locales...${NC}"
  else
    echo -e "${BLUE}[2/4] No es un repositorio Git, saltando...${NC}"
  fi

  # 3. Construir y levantar contenedores
  echo -e "${BLUE}[3/4] Construyendo y levantando contenedor...${NC}"
  $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  $DOCKER_COMPOSE_CMD up -d --build

  # 4. Limpieza
  echo -e "${BLUE}[4/4] Limpiando imágenes antiguas...${NC}"
  docker image prune -f > /dev/null 2>&1

  # Verificación
  echo -e "${YELLOW}Esperando a que el servicio esté listo...${NC}"
  sleep 3

  if docker ps | grep -q "${CONTAINER_NAME}"; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎁 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE! 🎁          ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Accede a la aplicación en:                           ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║  Local:   ${CYAN}http://localhost:${APP_PORT}${GREEN}                       ║${NC}"
    echo -e "${GREEN}║  Red:     ${CYAN}http://${LOCAL_IP}:${APP_PORT}${GREEN}                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
  else
    echo -e "${RED}❌ ERROR: El contenedor no está corriendo${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=20
    return 1
  fi
}

# --- COMANDOS POR ARGUMENTOS ---

if [[ "$1" == "logs" ]]; then
  $DOCKER_COMPOSE_CMD logs -f
  exit 0
fi

if [[ "$1" == "stop" ]] || [[ "$1" == "down" ]]; then
  $DOCKER_COMPOSE_CMD down
  echo -e "${GREEN}Servicios detenidos.${NC}"
  exit 0
fi

if [[ "$1" == "status" ]]; then
  docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  exit 0
fi

if [[ "$1" == "deploy" ]]; then
  deploy_app
  exit $?
fi

if [[ "$1" == "help" ]] || [[ "$1" == "--help" ]]; then
  echo -e "${CYAN}Uso: ./deploy.sh [comando]${NC}"
  echo ""
  echo "Comandos:"
  echo "  (sin args)    Menú interactivo"
  echo "  deploy        Desplegar directamente"
  echo "  logs          Ver logs"
  echo "  stop          Detener servicios"
  echo "  status        Ver estado"
  exit 0
fi

# Sin argumentos = menú interactivo
if [[ -z "$1" ]]; then
  interactive_menu
fi
