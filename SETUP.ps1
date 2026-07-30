#Requires -Version 5.1
<#
.SYNOPSIS
    Initial setup for Panah / Volunteer Management Platform
.DESCRIPTION
    Checks Docker, creates .env, builds images, starts services, seeds data
#>
$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-DockerRunning {
    docker info 1>$null 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Get-EnvValue([string]$Name, [string]$Default) {
    if (-not (Test-Path ".env")) { return $Default }
    $line = Select-String -Path ".env" -Pattern ("^\s*" + [regex]::Escape($Name) + "\s*=") -ErrorAction SilentlyContinue | Select-Object -Last 1
    if (-not $line) { return $Default }
    return ($line.Line -split "=", 2)[1].Trim()
}

function Set-EnvValue([string]$Name, [string]$Value) {
    $content = @(Get-Content ".env" -ErrorAction Stop)
    $pattern = "^\s*$([regex]::Escape($Name))\s*="
    $replaced = $false
    $content = $content | ForEach-Object {
        if ($_ -match $pattern) {
            $replaced = $true
            "$Name=$Value"
        } else {
            $_
        }
    }
    if (-not $replaced) {
        $content += "$Name=$Value"
    }
    Set-Content ".env" $content
}

function Test-TcpPortFree([int]$Port) {
    $listener = $null
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($listener) { $listener.Stop() }
    }
}

function Resolve-FreePort([string]$EnvName, [int]$Fallback) {
    $current = [int](Get-EnvValue $EnvName $Fallback)
    if (Test-TcpPortFree $current) { return $current }
    Write-Host "Port $current ($EnvName) is not available (in use or reserved by Windows)." -ForegroundColor Yellow
    $candidate = $current
    for ($i = 0; $i -lt 50; $i++) {
        $candidate = if ($current -lt 1000) { $current + 100 + $i } else { $current + $i }
        if (Test-TcpPortFree $candidate) {
            Set-EnvValue $EnvName $candidate
            Write-Host "  -> $EnvName auto-changed to $candidate." -ForegroundColor Green
            return $candidate
        }
    }
    Write-Host "  -> No free port found for $EnvName; set it manually in .env." -ForegroundColor Red
    return $current
}

Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "   Volunteer Management Platform - SETUP" -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""

Write-Step "Checking Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed." -ForegroundColor Red
    Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-DockerRunning)) {
    Write-Host "Error: Docker is not running." -ForegroundColor Red
    Write-Host "Open Docker Desktop and run SETUP again." -ForegroundColor Yellow
    exit 1
}

docker compose version 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker Compose V2 not found." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is ready." -ForegroundColor Green

Write-Step "Preparing .env..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env created from .env.example." -ForegroundColor Green
} else {
    Write-Host ".env already exists — left unchanged." -ForegroundColor Yellow
}

Write-Step "Creating data directories..."
@("logs\nginx", "media", "static", "database\backups") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Step "Checking host ports..."
$httpPort     = Resolve-FreePort "HTTP_PORT" 80
$httpsPort    = Resolve-FreePort "HTTPS_PORT" 443
$pgadminPort  = Resolve-FreePort "PGADMIN_PORT" 5050
$mailWebPort  = Resolve-FreePort "MAILHOG_WEB_PORT" 8025
$mailSmtpPort = Resolve-FreePort "MAILHOG_SMTP_PORT" 1025
Write-Host "Ports are ready." -ForegroundColor Green

Write-Step "Building images (this may take several minutes)..."
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "Starting services..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "Waiting for backend..."
$maxWait = 120
$elapsed = 0
$healthy = $false
while ($elapsed -lt $maxWait) {
    $status = docker inspect --format='{{.State.Health.Status}}' volunteer-management-backend 2>$null
    if ($status -eq "healthy") {
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  ... waiting ($elapsed s)" -ForegroundColor DarkGray
}

if (-not $healthy) {
    Write-Host "Warning: backend is not healthy yet. Check logs:" -ForegroundColor Yellow
    Write-Host "  docker logs volunteer-management-backend" -ForegroundColor Yellow
} else {
    Write-Host "Backend is ready." -ForegroundColor Green
}

Write-Step "Loading seed data..."
docker compose exec -T volunteer-management-backend python manage.py seed_data 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Base data (roles, permissions, admin) loaded." -ForegroundColor Green
}

Write-Step "Loading demo scenario (optional)..."
docker compose exec -T volunteer-management-backend python manage.py seed_demo 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Demo scenario (disaster + mission) loaded." -ForegroundColor Green
}

$adminEmail = Get-EnvValue "ADMIN_EMAIL" "InvesticaCO@gmail.com"
$adminPassword = Get-EnvValue "ADMIN_PASSWORD" "(see .env ADMIN_PASSWORD)"
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "   Setup completed successfully!" -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:           http://localhost:$httpPort" -ForegroundColor White
Write-Host "  API Docs:      http://localhost:$httpPort/api/docs/" -ForegroundColor White
Write-Host "  PgAdmin:       http://localhost:$pgadminPort" -ForegroundColor White
Write-Host "  Mailhog:       http://localhost:$mailWebPort" -ForegroundColor White
Write-Host ""
Write-Host "  Admin email:   $adminEmail" -ForegroundColor Yellow
Write-Host "  Password:      $adminPassword" -ForegroundColor Yellow
Write-Host "  (Development-only credentials from .env — change before any shared/staging use.)" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  Stop:          Stop.bat" -ForegroundColor DarkGray
Write-Host "  Start:         Start.bat" -ForegroundColor DarkGray
Write-Host ""

exit 0
