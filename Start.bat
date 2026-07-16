@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Panah Platform - Start

echo.
echo  =========================================
echo    Panah Platform - START
echo  =========================================
echo.

:: --- Quick checks (single Docker call) ---
docker info >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Docker is not available. Install Docker Desktop or start it, then run SETUP.bat if needed.
    goto :end_error
)

if not exist ".env" (
    echo  [ERROR] .env file not found. Run SETUP.bat first.
    goto :end_error
)

:: --- Start without rebuild (faster; use SETUP.bat to rebuild) ---
echo  Starting containers...
docker compose up -d --no-build --remove-orphans
if errorlevel 1 (
    echo.
    echo  [INFO] Images may be missing. Building once, then starting...
    docker compose up -d --build --remove-orphans
    if errorlevel 1 goto :end_error
)

:: --- Wait for backend health (max 45s, poll every 2s) ---
echo  Waiting for services to be ready...
set /a WAIT=0
:wait_loop
docker inspect --format="{{.State.Health.Status}}" volunteer-management-backend 2>nul | findstr /i "healthy" >nul
if not errorlevel 1 goto :services_ready
set /a WAIT+=2
if %WAIT% geq 45 goto :services_ready
timeout /t 2 /nobreak >nul
goto :wait_loop

:services_ready

:: --- Wait for frontend (Vite) via nginx (max 60s) ---
set /a FE_WAIT=0
:wait_frontend
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost/' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200 -and $r.Content -match 'id=\"root\"') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :frontend_ready
set /a FE_WAIT+=2
if %FE_WAIT% geq 60 goto :frontend_ready
timeout /t 2 /nobreak >nul
goto :wait_frontend

:frontend_ready
echo.
echo  =========================================
echo    Platform is running
echo  =========================================
echo.
echo  --- Application ---
echo    Website (Frontend):     http://localhost
echo    Login:                  http://localhost/login
echo    Register:               http://localhost/register
echo.
echo  --- Backend API ---
echo    API Base (v1):            http://localhost/api/v1/
echo    Health Check:             http://localhost/api/v1/health/
echo    OpenAPI Schema:           http://localhost/api/schema/
echo    Swagger UI (API Docs):    http://localhost/api/docs/
echo    Django Admin:             http://localhost/admin/
echo.
echo  --- Dev Tools ---
echo    PgAdmin:                  http://localhost:5050
echo    Mailhog (Email UI):         http://localhost:8025
echo.
echo  --- Default Admin ---
echo    Email:    InvesticaCO@gmail.com
echo    Password: Investica003
echo.
echo  Opening website in your browser...
start "" "http://localhost"
echo.
goto :end_ok

:end_error
echo.
pause
exit /b 1

:end_ok
pause
exit /b 0
