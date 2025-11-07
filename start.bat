@echo off
REM Script para levantar Backend y Frontend de CineSpark en Windows
REM Uso: start.bat

echo ========================================
echo    CineSpark - Iniciando Servidores
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "server" (
    echo Error: Este script debe ejecutarse desde la raiz del proyecto CineSpark
    pause
    exit /b 1
)

if not exist "client" (
    echo Error: Este script debe ejecutarse desde la raiz del proyecto CineSpark
    pause
    exit /b 1
)

REM Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js no esta instalado
    pause
    exit /b 1
)

REM Iniciar Backend
echo [1/2] Iniciando Backend (puerto 4000)...
cd server

REM Verificar si existe .env
if not exist ".env" (
    echo Advertencia: Archivo .env no encontrado. Copiando desde ENV.EXAMPLE.txt...
    copy ENV.EXAMPLE.txt .env >nul 2>&1
    echo Por favor, configura tu archivo .env con la API key de TMDB
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias del backend...
    call npm install
)

REM Iniciar backend en ventana nueva
start "CineSpark Backend" cmd /k "npm run dev"
cd ..

REM Esperar un poco
timeout /t 5 /nobreak >nul

REM Iniciar Frontend
echo.
echo [2/2] Iniciando Frontend (puerto 5173)...
cd client

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    call npm install
)

REM Iniciar frontend en ventana nueva
start "CineSpark Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo    Servidores iniciados correctamente
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Nota: El catalogo se cargara automaticamente desde TMDB al iniciar el backend
echo.
echo Las ventanas de los servidores se abriran en ventanas separadas.
echo Cierra las ventanas para detener los servidores.
echo.
pause

