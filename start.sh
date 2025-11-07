#!/bin/bash

# Script para levantar Backend y Frontend de CineSpark
# Uso: ./start.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}Deteniendo servidores...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}Servidores detenidos.${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CineSpark - Iniciando Servidores${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verificar que estamos en el directorio correcto
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo -e "${RED}Error: Este script debe ejecutarse desde la raíz del proyecto CineSpark${NC}"
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado${NC}"
    exit 1
fi

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm no está instalado${NC}"
    exit 1
fi

# Iniciar Backend
echo -e "${BLUE}[1/2]${NC} Iniciando Backend (puerto 4000)..."
cd server

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Copiando desde ENV.EXAMPLE.txt...${NC}"
    cp ENV.EXAMPLE.txt .env 2>/dev/null || true
    echo -e "${YELLOW}⚠️  Por favor, configura tu archivo .env con la API key de TMDb${NC}"
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
    npm install
fi

# Iniciar backend en background
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend esté listo
echo -e "${YELLOW}Esperando a que el backend esté listo...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend iniciado correctamente${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}⚠️  Backend tardó mucho en iniciar, pero continuando...${NC}"
    fi
done

# Iniciar Frontend
echo -e "\n${BLUE}[2/2]${NC} Iniciando Frontend (puerto 5173)..."
cd client

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
    npm install
fi

# Iniciar frontend en background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar un poco para que el frontend inicie
sleep 3

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Servidores iniciados correctamente${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "${BLUE}Backend:${NC}  http://localhost:4000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "\n${YELLOW}Nota: El catálogo se cargará automáticamente desde TMDb al iniciar el backend${NC}"
echo -e "${YELLOW}Logs del Backend:${NC}  tail -f backend.log"
echo -e "${YELLOW}Logs del Frontend:${NC} tail -f frontend.log"
echo -e "\n${YELLOW}Presiona Ctrl+C para detener los servidores${NC}\n"

# Mostrar logs en tiempo real
tail -f backend.log frontend.log

