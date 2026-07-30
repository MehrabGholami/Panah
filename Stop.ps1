#Requires -Version 5.1
<#
.SYNOPSIS
    Stop Panah / Volunteer Management Platform
#>
$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  Stopping platform..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found. Nothing to stop." -ForegroundColor Yellow
    exit 0
}

docker compose down
$composeExit = $LASTEXITCODE
if ($composeExit -ne 0) {
    Write-Host "docker compose down failed (exit $composeExit)." -ForegroundColor Red
    exit $composeExit
}

Write-Host ""
Write-Host "  Platform stopped." -ForegroundColor Green
Write-Host "  (Data and volumes were preserved.)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To start again: Start.bat" -ForegroundColor DarkGray
Write-Host ""

exit 0
