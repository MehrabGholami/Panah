@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Panah Platform - Refresh UI

echo.
echo  Refreshing frontend (reloads latest UI changes)...
echo.

docker restart volunteer-management-frontend >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Could not restart frontend. Is Docker running?
    goto :end_error
)

echo  Waiting for Vite...
timeout /t 5 /nobreak >nul

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost/' -UseBasicParsing -TimeoutSec 10 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo  [WARN] Frontend may still be starting. Wait a few seconds, then open:
) else (
    echo  Frontend is ready.
)

echo    http://localhost
echo.
echo  Tip: Press Ctrl+F5 in the browser after this script finishes.
echo.
goto :end_ok

:end_error
pause
exit /b 1

:end_ok
pause
exit /b 0
