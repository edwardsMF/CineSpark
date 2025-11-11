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
    local stopped_any=false
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null && stopped_any=true || true
        echo -e "${GREEN}✅ Backend detenido${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend no fue iniciado por este script (ya estaba corriendo)${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null && stopped_any=true || true
        echo -e "${GREEN}✅ Frontend detenido${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend no fue iniciado por este script (ya estaba corriendo)${NC}"
    fi
    
    if [ "$stopped_any" = true ]; then
        echo -e "${GREEN}Servidores detenidos.${NC}"
    else
        echo -e "${YELLOW}Nota: Los servidores que ya estaban corriendo siguen activos.${NC}"
        echo -e "${YELLOW}      Para detenerlos, usa Ctrl+C en sus terminales o cierra sus procesos.${NC}"
    fi
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
echo -e "${BLUE}[1/5]${NC} Verificando configuración del Backend..."
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
echo -e "${BLUE}[2/5]${NC} Verificando configuración de PostgreSQL..."
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
echo -e "\n${BLUE}[3/5]${NC} Verificando conexión a PostgreSQL..."
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

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    local service_name=$2
    
    # Método 1: Intentar conectar con curl (más confiable para servicios HTTP)
    if command -v curl &> /dev/null; then
        if curl -s --connect-timeout 1 "http://localhost:$port" > /dev/null 2>&1; then
            return 0  # Puerto en uso
        fi
    fi
    
    # Método 2: Usar netcat si está disponible
    if command -v nc &> /dev/null; then
        if nc -z localhost $port 2>/dev/null; then
            return 0  # Puerto en uso
        fi
    fi
    
    # Método 3: Usar netstat (Windows y Linux)
    if command -v netstat &> /dev/null; then
        # Windows: netstat -an | findstr ":$port"
        # Linux/Mac: netstat -an | grep ":$port.*LISTEN"
        if netstat -an 2>/dev/null | grep -qE ":$port.*LISTEN|:$port.*ESTABLISHED|:$port.*TIME_WAIT" || \
           netstat -an 2>/dev/null | grep -q ":$port "; then
            return 0  # Puerto en uso
        fi
    fi
    
    # Método 4: Usar PowerShell en Windows (si está disponible)
    if command -v powershell.exe &> /dev/null; then
        if powershell.exe -Command "Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue" 2>/dev/null | grep -q "True"; then
            return 0  # Puerto en uso
        fi
    fi
    
    return 1  # Puerto libre
}

# Verificar puerto del backend
echo -e "\n${BLUE}[4/5]${NC} Verificando puerto del Backend (4000)..."
if check_port 4000 "Backend"; then
    echo -e "${YELLOW}⚠️  El puerto 4000 ya está en uso${NC}"
    echo -e "${YELLOW}   Esto puede significar que el backend ya está corriendo${NC}"
    echo -e "${YELLOW}   Verificando si es nuestro backend...${NC}"
    
    # Verificar si es nuestro backend haciendo una petición al health check
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ya está corriendo en el puerto 4000${NC}"
        BACKEND_PID=""
        SKIP_BACKEND_START=true
    else
        echo -e "${RED}❌ El puerto 4000 está ocupado por otro proceso${NC}"
        echo -e "${YELLOW}   Por favor, detén el proceso que usa el puerto 4000 o cambia el puerto en server/.env${NC}"
        cd ..
        exit 1
    fi
else
    echo -e "${GREEN}✅ Puerto 4000 disponible${NC}"
    SKIP_BACKEND_START=false
fi

# Iniciar backend en background (solo si no está corriendo)
if [ "$SKIP_BACKEND_START" != "true" ]; then
    echo -e "${BLUE}Iniciando Backend (puerto 4000)...${NC}"
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
else
    echo -e "${YELLOW}Omitiendo inicio del backend (ya está corriendo)${NC}"
fi
cd ..

# Esperar a que el backend esté listo (solo si lo acabamos de iniciar)
if [ "$SKIP_BACKEND_START" != "true" ]; then
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
fi

# Verificar puerto del frontend
echo -e "\n${BLUE}[5/5]${NC} Verificando puerto del Frontend (5173)..."
if check_port 5173 "Frontend"; then
    echo -e "${YELLOW}⚠️  El puerto 5173 ya está en uso${NC}"
    echo -e "${YELLOW}   Esto puede significar que el frontend ya está corriendo${NC}"
    echo -e "${YELLOW}   Verificando si es nuestro frontend...${NC}"
    
    # Verificar si es nuestro frontend (intentar conectar)
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend ya está corriendo en el puerto 5173${NC}"
        FRONTEND_PID=""
        SKIP_FRONTEND_START=true
    else
        echo -e "${RED}❌ El puerto 5173 está ocupado por otro proceso${NC}"
        echo -e "${YELLOW}   Por favor, detén el proceso que usa el puerto 5173${NC}"
        # Limpiar backend si lo iniciamos nosotros
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 1
    fi
else
    echo -e "${GREEN}✅ Puerto 5173 disponible${NC}"
    SKIP_FRONTEND_START=false
fi

# Iniciar Frontend
cd client

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
    npm install
fi

# Iniciar frontend en background (solo si no está corriendo)
if [ "$SKIP_FRONTEND_START" != "true" ]; then
    echo -e "${BLUE}Iniciando Frontend (puerto 5173)...${NC}"
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
else
    echo -e "${YELLOW}Omitiendo inicio del frontend (ya está corriendo)${NC}"
fi
cd ..

# Esperar un poco para que el frontend inicie (solo si lo acabamos de iniciar)
if [ "$SKIP_FRONTEND_START" != "true" ]; then
    sleep 3
fi

echo -e "\n${GREEN}========================================${NC}"
if [ "$SKIP_BACKEND_START" = "true" ] || [ "$SKIP_FRONTEND_START" = "true" ]; then
    echo -e "${GREEN}   ✅ Servidores listos${NC}"
    if [ "$SKIP_BACKEND_START" = "true" ]; then
        echo -e "${YELLOW}   (Backend ya estaba corriendo)${NC}"
    fi
    if [ "$SKIP_FRONTEND_START" = "true" ]; then
        echo -e "${YELLOW}   (Frontend ya estaba corriendo)${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Servidores iniciados correctamente${NC}"
fi
echo -e "${GREEN}========================================${NC}\n"
echo -e "${GREEN}✅ Base de datos PostgreSQL:${NC} Conectada"
echo -e "${BLUE}Backend:${NC}  http://localhost:4000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "\n${YELLOW}Nota: El catálogo se cargará automáticamente desde TMDb al iniciar el backend${NC}"
if [ "$SKIP_BACKEND_START" != "true" ]; then
    echo -e "${YELLOW}Logs del Backend:${NC}  tail -f backend.log"
fi
if [ "$SKIP_FRONTEND_START" != "true" ]; then
    echo -e "${YELLOW}Logs del Frontend:${NC} tail -f frontend.log"
fi
if [ "$SKIP_BACKEND_START" = "true" ] || [ "$SKIP_FRONTEND_START" = "true" ]; then
    echo -e "\n${YELLOW}⚠️  Nota: Al presionar Ctrl+C, solo se detendrán los servidores iniciados por este script${NC}"
    echo -e "${YELLOW}      Los servidores que ya estaban corriendo seguirán activos${NC}"
else
    echo -e "\n${YELLOW}Presiona Ctrl+C para detener los servidores${NC}"
fi
echo ""

# Mostrar logs en tiempo real (solo de los servidores que iniciamos)
LOG_FILES=""
if [ "$SKIP_BACKEND_START" != "true" ] && [ -f "backend.log" ]; then
    LOG_FILES="$LOG_FILES backend.log"
fi
if [ "$SKIP_FRONTEND_START" != "true" ] && [ -f "frontend.log" ]; then
    LOG_FILES="$LOG_FILES frontend.log"
fi

if [ ! -z "$LOG_FILES" ]; then
    tail -f $LOG_FILES
else
    echo -e "${YELLOW}No hay logs nuevos para mostrar (servidores ya estaban corriendo)${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
    # Mantener el script corriendo hasta que el usuario presione Ctrl+C
    while true; do
        sleep 1
    done
fi

