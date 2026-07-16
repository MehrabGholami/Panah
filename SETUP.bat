@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panah Platform - Setup

echo.
echo  =========================================
echo    Panah Platform - SETUP
echo  =========================================
echo.

:: --- Check Docker ---
echo [1/6] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Docker is not installed.
    echo  Please install Docker Desktop:
    echo  https://www.docker.com/products/docker-desktop/
    goto :end_error
)

docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Docker is not running.
    echo  Please start Docker Desktop and try again.
    goto :end_error
)
echo       Docker is ready.

:: --- .env file ---
echo [2/6] Configuring environment...
if not exist ".env" (
    copy /Y ".env.example" ".env" >nul
    echo       Created .env file.
) else (
    echo       .env file already exists.
)

:: --- Directories ---
echo [3/6] Creating data directories...
if not exist "logs\nginx" mkdir "logs\nginx"
if not exist "media" mkdir "media"
if not exist "static" mkdir "static"
if not exist "database\backups" mkdir "database\backups"
echo       Directories ready.

:: --- Build images ---
echo [4/6] Building images (this may take a few minutes)...
docker compose build
if errorlevel 1 goto :end_error

:: --- Start services ---
echo [5/6] Starting services...
docker compose up -d
if errorlevel 1 goto :end_error

:: --- Seed data ---
echo [6/6] Loading initial data...
timeout /t 15 /nobreak >nul
docker compose exec -T volunteer-management-backend python manage.py seed_data
docker compose exec -T volunteer-management-backend python manage.py seed_demo

echo.
echo  =========================================
echo    Setup completed successfully!
echo  =========================================
echo.
echo    Application:  http://localhost
echo    API Docs:     http://localhost/api/docs/
echo    PgAdmin:      http://localhost:5050
echo    Mailhog:      http://localhost:8025
echo.
echo    Admin email:  InvesticaCO@gmail.com
echo    Password:     Investica003
echo.
echo    To start:  Start.bat
echo    To stop:   Stop.bat
echo.
goto :end_ok

:end_error
echo.
echo  [ERROR] Setup failed.
echo.
pause
exit /b 1

:end_ok
pause
exit /b 0
