@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Panah Platform - Setup

where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell is required to run setup on Windows.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP.ps1"
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
    echo.
    echo  [ERROR] Setup failed.
    echo.
    pause
    exit /b %EXITCODE%
)
pause
exit /b 0
