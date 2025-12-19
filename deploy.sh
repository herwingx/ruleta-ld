#!/bin/bash

# 🚀 Secret Santa Roulette - Deployment Script
# Target: Ubuntu Server with Docker & Docker Compose

set -e  # Salir si hay error

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# Puerto de la aplicación (debe coincidir con docker-compose.yml)
APP_PORT=8080

# Detectar comando docker-compose
DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker-compose"
fi

# Función para mostrar el banner
show_banner() {
  clear
  echo -e "${GREEN}"
  echo "    ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️"
  echo ""
  echo -e "${RED}       🎄 SECRET SANTA ROULETTE 🎄${NC}"
  echo -e "${GREEN}          Deployment Manager${NC}"
  echo ""
  echo -e "${GREEN}    ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️  ❄️${NC}"
  echo ""
}

# Función para mostrar el menú
show_menu() {
  echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}    ${BOLD}¿Qué deseas hacer?${NC}                 ${CYAN}║${NC}"
  echo -e "${CYAN}╠════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC}                                        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}1)${NC} 🚀 Desplegar aplicación            ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}2)${NC} 🔄 Resetear BD y desplegar         ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}3)${NC} 📋 Ver logs en tiempo real         ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}4)${NC} ⏹️  Detener servicios               ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}5)${NC} 📊 Ver estado de contenedores      ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}  ${GREEN}6)${NC} 🚪 Salir                            ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}                                        ${CYAN}║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
  echo ""
}

# Función para el menú interactivo
interactive_menu() {
  while true; do
    show_banner
    show_menu
    
    echo -ne "${YELLOW}Selecciona una opción [1-6]: ${NC}"
    read -r choice
    
    case $choice in
      1)
        echo ""
        deploy_app ""
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      2)
        echo ""
        deploy_app "reset"
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      3)
        echo ""
        echo -e "${BLUE}Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
        $DOCKER_COMPOSE_CMD logs -f || true
        ;;
      4)
        echo ""
        echo -e "${YELLOW}Deteniendo servicios...${NC}"
        $DOCKER_COMPOSE_CMD down
        echo -e "${GREEN}✓ Servicios detenidos.${NC}"
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      5)
        echo ""
        echo -e "${BLUE}Estado de los contenedores:${NC}"
        docker ps --filter "name=secret-santa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo -e "${YELLOW}No hay contenedores activos${NC}"
        echo ""
        echo -e "${YELLOW}Presiona Enter para volver al menú...${NC}"
        read -r
        ;;
      6)
        echo ""
        echo -e "${GREEN}🎄 ¡Feliz Navidad! Hasta pronto... 🎄${NC}"
        echo ""
        exit 0
        ;;
      *)
        echo -e "${RED}Opción no válida. Por favor, selecciona 1-6.${NC}"
        sleep 1
        ;;
    esac
  done
}

# Función principal de despliegue
deploy_app() {
  local RESET_MODE="$1"
  
  echo -e "${BLUE}🎄 === Iniciando despliegue de Ruleta Secret Santa === 🎄${NC}"

  # --- VERIFICACIONES ---

  # 1. Verificar Docker
  echo -e "${BLUE}[1/6] Verificando dependencias...${NC}"
  if ! [ -x "$(command -v docker)" ]; then
    echo -e "${RED}Error: docker no está instalado.${NC}" >&2
    return 1
  fi

  if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose no está instalado.${NC}" >&2
    return 1
  fi
  echo -e "${GREEN}✓ Docker y Docker Compose disponibles${NC}"

  # 2. Manejo de Reseteo (Opcional)
  if [[ "$RESET_MODE" == "reset" ]]; then
    echo -e "${RED}[2/6] ⚠️ Reseteando base de datos...${NC}"
    $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
    rm -f server/santa_v2.db
    touch server/santa_v2.db
    echo -e "${GREEN}✓ Base de datos reseteada correctamente.${NC}"
  else
    echo -e "${BLUE}[2/6] Manteniendo base de datos existente${NC}"
  fi

  # 3. Asegurar archivos de persistencia
  echo -e "${BLUE}[3/6] Preparando archivos de persistencia...${NC}"
  mkdir -p server
  touch server/santa_v2.db
  if [ ! -f server/participants.json ]; then
    echo '[]' > server/participants.json
    echo -e "${YELLOW}⚠ server/participants.json no existía, se creó uno vacío.${NC}"
  fi
  echo -e "${GREEN}✓ Archivos de persistencia listos${NC}"

  # 4. Git pull (opcional)
  if [ -d .git ]; then
    echo -e "${BLUE}[4/6] Actualizando código desde Git...${NC}"
    git pull origin main 2>/dev/null || echo -e "${YELLOW}⚠ Git pull falló, continuando con archivos locales...${NC}"
  else
    echo -e "${BLUE}[4/6] No es un repositorio Git, saltando...${NC}"
  fi

  # 5. Construir y levantar contenedores
  echo -e "${BLUE}[5/6] Construyendo y levantando contenedores...${NC}"
  $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  $DOCKER_COMPOSE_CMD up -d --build

  # 6. Limpieza
  echo -e "${BLUE}[6/6] Limpiando imágenes antiguas...${NC}"
  docker image prune -f > /dev/null 2>&1

  # --- VERIFICACIÓN DE SALUD ---
  echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
  sleep 3

  # Verificar que los contenedores estén corriendo
  if docker ps | grep -q "secret-santa-app" && docker ps | grep -q "secret-santa-proxy"; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   🎄 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE! 🎄          ║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║  Accede a la aplicación en:                           ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║  Local:   ${CYAN}http://localhost:${APP_PORT}${GREEN}                       ║${NC}"
    echo -e "${GREEN}║  Red:     ${CYAN}http://${LOCAL_IP}:${APP_PORT}${GREEN}                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Logs recientes:${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=5 app
  else
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ ERROR: Los contenedores no están corriendo       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Revisa los logs con: ./deploy.sh logs${NC}"
    $DOCKER_COMPOSE_CMD logs --tail=20
    return 1
  fi
}

# --- COMANDOS ESPECIALES (por argumentos) ---

# Ver logs en tiempo real
if [[ "$1" == "logs" ]] || [[ "$1" == "--logs" ]]; then
  echo -e "${BLUE}Mostrando logs en tiempo real (Ctrl+C para salir)...${NC}"
  $DOCKER_COMPOSE_CMD logs -f
  exit 0
fi

# Detener servicios
if [[ "$1" == "stop" ]] || [[ "$1" == "down" ]]; then
  echo -e "${YELLOW}Deteniendo servicios...${NC}"
  $DOCKER_COMPOSE_CMD down
  echo -e "${GREEN}Servicios detenidos.${NC}"
  exit 0
fi

# Estado de los servicios
if [[ "$1" == "status" ]]; then
  echo -e "${BLUE}Estado de los contenedores:${NC}"
  docker ps --filter "name=secret-santa" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  exit 0
fi

# Ayuda
if [[ "$1" == "help" ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  echo -e "${CYAN}Uso: ./deploy.sh [comando]${NC}"
  echo ""
  echo "Comandos disponibles:"
  echo "  (sin args)    Menú interactivo"
  echo "  deploy        Desplegar directamente (sin menú)"
  echo "  reset         Resetear base de datos y desplegar"
  echo "  --reset-db    Igual que reset"
  echo "  logs          Ver logs en tiempo real"
  echo "  stop          Detener todos los servicios"
  echo "  status        Ver estado de los contenedores"
  echo "  help          Mostrar esta ayuda"
  exit 0
fi

# Desplegar directamente (sin menú)
if [[ "$1" == "deploy" ]]; then
  deploy_app ""
  exit $?
fi

# Resetear BD y desplegar
if [[ "$1" == "--reset-db" ]] || [[ "$1" == "reset" ]]; then
  deploy_app "reset"
  exit $?
fi

# Si no hay argumentos, mostrar menú interactivo
if [[ -z "$1" ]]; then
  interactive_menu
fi
