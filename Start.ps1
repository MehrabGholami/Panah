#Requires -Version 5.1
<#
.SYNOPSIS
    Start Volunteer Management Platform
#>
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  Starting platform..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed. Run SETUP.bat first." -ForegroundColor Red
    exit 1
}

docker info 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Open Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "Error: .env not found. Run SETUP.bat first." -ForegroundColor Yellow
    exit 1
}

function Get-EnvValue([string]$Name, [string]$Default) {
    $line = Select-String -Path ".env" -Pattern ("^\s*" + [regex]::Escape($Name) + "\s*=") -ErrorAction SilentlyContinue | Select-Object -Last 1
    if (-not $line) { return $Default }
    return ($line.Line -split "=", 2)[1].Trim()
}

function Wait-BackendHealthy([int]$TimeoutSec = 180) {
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        $status = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' volunteer-management-backend 2>$null
        if ($status -eq "healthy") { return $true }
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host ("  ... waiting for backend ({0}s / {1}s) status={2}" -f $elapsed, $TimeoutSec, $status) -ForegroundColor DarkGray
    }
    return $false
}

$httpPort    = Get-EnvValue "HTTP_PORT" "80"
$pgadminPort = Get-EnvValue "PGADMIN_PORT" "5050"
$mailWebPort = Get-EnvValue "MAILHOG_WEB_PORT" "8025"
$adminEmail  = Get-EnvValue "ADMIN_EMAIL" "Investicaco@gmail.com"
$adminPass   = Get-EnvValue "ADMIN_PASSWORD" "ADMIN"

# Start core services first; do not fail the whole stack if one dependent
# briefly waits on health (backend migrate/seed can take >40s on cold start).
docker compose up -d --remove-orphans volunteer-management-postgres volunteer-management-redis volunteer-management-mailhog volunteer-management-pgadmin
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start infrastructure services." -ForegroundColor Red
    exit $LASTEXITCODE
}

docker compose up -d --remove-orphans volunteer-management-backend volunteer-management-frontend volunteer-management-celery volunteer-management-celery-beat
# Ignore transient non-zero here; we wait for health explicitly below.

Write-Host "Waiting for backend to become healthy..." -ForegroundColor Cyan
if (-not (Wait-BackendHealthy 180)) {
    Write-Host ""
    Write-Host "Backend did not become healthy in time." -ForegroundColor Red
    Write-Host "Recent backend logs:" -ForegroundColor Yellow
    docker logs volunteer-management-backend --tail 40
    Write-Host ""
    Write-Host "Try: docker compose logs -f volunteer-management-backend" -ForegroundColor Yellow
    exit 1
}

docker compose up -d --remove-orphans volunteer-management-nginx
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nginx failed to start. Check ports in .env (HTTP_PORT / HTTPS_PORT)." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Ensure nginx refreshes upstream DNS after backend recreate
docker compose restart volunteer-management-nginx 1>$null 2>$null

Write-Host ""
Write-Host "  Platform is running." -ForegroundColor Green
Write-Host ""
Write-Host "  App:       http://localhost:$httpPort" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:$httpPort/api/docs/" -ForegroundColor White
Write-Host "  PgAdmin:   http://localhost:$pgadminPort" -ForegroundColor White
Write-Host "  Mailhog:   http://localhost:$mailWebPort" -ForegroundColor White
Write-Host ""
Write-Host "  Admin:     $adminEmail / $adminPass" -ForegroundColor Yellow
Write-Host ""

docker compose ps --format 'table {{.Name}}\t{{.Status}}' | Out-Host
Write-Host ""

exit 0
