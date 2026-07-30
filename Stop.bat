@echo off
cd /d "%~dp0"
title Panah Platform - Stop

where powershell >nul 2>&1
if not errorlevel 1 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Stop.ps1"
    set EXITCODE=%ERRORLEVEL%
    if not "%EXITCODE%"=="0" (
        echo.
        echo  [ERROR] Stop failed.
        echo.
        pause
        exit /b %EXITCODE%
    )
    pause
    exit /b 0
)

docker compose down
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
    echo.
    echo  [ERROR] Stop failed.
    echo.
    pause
    exit /b %EXITCODE%
)
echo.
echo  Platform stopped.
echo.
pause
exit /b 0
