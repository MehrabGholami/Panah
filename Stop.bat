@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panah Platform - Stop

echo.
echo  Stopping the platform...
echo.

docker compose down
if errorlevel 1 (
    echo.
    echo  [ERROR] Failed to stop the platform.
    pause
    exit /b 1
)

echo.
echo  Platform stopped.
echo  (Data and volumes have been preserved)
echo.
echo  To start again: Start.bat
echo.
pause
exit /b 0
