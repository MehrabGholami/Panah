@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panah Platform - Start

where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell is required.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
    echo.
    echo  [ERROR] Start failed.
    echo.
    pause
    exit /b %EXITCODE%
)

for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"HTTP_PORT=" ".env" 2^>nul`) do set "HTTP_PORT=%%B"
if not defined HTTP_PORT set "HTTP_PORT=80"
if "%HTTP_PORT%"=="80" (
    start "" "http://localhost/"
) else (
    start "" "http://localhost:%HTTP_PORT%/"
)

pause
exit /b 0
