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
echo -e "${BLUE}[0/3]${NC} Verificando configuración del Backend..."
cd server

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Copiando desde ENV.EXAMPLE.txt...${NC}"
    cp ENV.EXAMPLE.txt .env 2>/dev/null || true
    echo -e "${RED}❌ Por favor, configura tu archivo .env con las credenciales de PostgreSQL y la API key de TMDb${NC}"
    echo -e "${RED}   Luego ejecuta el script nuevamente.${NC}"
    cd ..
    exit 1
fi

# Cargar variables de entorno (maneja espacios y caracteres especiales)
set -a
source .env 2>/dev/null || export $(grep -v '^#' .env | grep -v '^$' | xargs)
set +a

# Verificar variables de PostgreSQL
echo -e "${BLUE}[1/3]${NC} Verificando configuración de PostgreSQL..."
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DATABASE" ]; then
    echo -e "${RED}❌ Error: Faltan variables de entorno de PostgreSQL en el archivo .env${NC}"
    echo -e "${RED}   Requeridas: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE${NC}"
    cd ..
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
echo -e "   Host: ${POSTGRES_HOST:-localhost}"
echo -e "   Puerto: ${POSTGRES_PORT:-5432}"
echo -e "   Base de datos: $POSTGRES_DATABASE"
echo -e "   Usuario: $POSTGRES_USER"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}Instalando dependencias del backend...${NC}"
    npm install
fi

# Verificar conexión a PostgreSQL
echo -e "\n${BLUE}[2/3]${NC} Verificando conexión a PostgreSQL..."
DB_TEST_OUTPUT=$(node scripts/test-postgres-connection-quiet.js 2>&1)
DB_TEST_EXIT=$?

if [ $DB_TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Conexión a PostgreSQL establecida correctamente${NC}"
    echo "$DB_TEST_OUTPUT" | grep -E "✅|⚠️" || true
else
    echo -e "${RED}❌ Error: No se pudo conectar a PostgreSQL${NC}"
    echo "$DB_TEST_OUTPUT"
    echo -e "\n${YELLOW}Revisa el archivo .env y asegúrate de que:${NC}"
    echo -e "   1. PostgreSQL esté corriendo"
    echo -e "   2. Las credenciales sean correctas"
    echo -e "   3. La base de datos exista"
    echo -e "\n${YELLOW}Para más detalles, ejecuta:${NC}"
    echo -e "   cd server && node scripts/test-postgres-connection.js"
    cd ..
    exit 1
fi

# Iniciar backend en background
echo -e "\n${BLUE}[3/3]${NC} Iniciando Backend (puerto 4000)..."
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
echo -e "\n${BLUE}[4/4]${NC} Iniciando Frontend (puerto 5173)..."
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
echo -e "${GREEN}✅ Base de datos PostgreSQL:${NC} Conectada"
echo -e "${BLUE}Backend:${NC}  http://localhost:4000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "\n${YELLOW}Nota: El catálogo se cargará automáticamente desde TMDb al iniciar el backend${NC}"
echo -e "${YELLOW}Logs del Backend:${NC}  tail -f backend.log"
echo -e "${YELLOW}Logs del Frontend:${NC} tail -f frontend.log"
echo -e "\n${YELLOW}Presiona Ctrl+C para detener los servidores${NC}\n"

# Mostrar logs en tiempo real
tail -f backend.log frontend.log

