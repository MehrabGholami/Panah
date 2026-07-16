#Requires -Version 5.1
<#
.SYNOPSIS
    راه‌اندازی اولیه Volunteer Management Platform
.DESCRIPTION
    بررسی Docker، ایجاد .env، ساخت imageها، اجرای سرویس‌ها و seed داده‌ها
#>
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-DockerRunning {
    try {
        docker info 2>$null | Out-Null
        return $true
    } catch {
        return $false
    }
}

Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "   Volunteer Management Platform - SETUP" -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""

# --- بررسی Docker ---
Write-Step "بررسی Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "خطا: Docker نصب نیست." -ForegroundColor Red
    Write-Host "لطفاً Docker Desktop را نصب کنید: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-DockerRunning)) {
    Write-Host "خطا: Docker در حال اجرا نیست." -ForegroundColor Red
    Write-Host "لطفاً Docker Desktop را باز کنید و دوباره SETUP را اجرا کنید." -ForegroundColor Yellow
    exit 1
}

$composeVersion = docker compose version 2>$null
if (-not $composeVersion) {
    Write-Host "خطا: Docker Compose V2 یافت نشد." -ForegroundColor Red
    exit 1
}
Write-Host "Docker آماده است." -ForegroundColor Green

# --- فایل محیط ---
Write-Step "تنظیم فایل محیط (.env)..."
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "فایل .env از .env.example ساخته شد." -ForegroundColor Green
} else {
    Write-Host "فایل .env از قبل وجود دارد — بدون تغییر." -ForegroundColor Yellow
}

# --- پوشه‌های مورد نیاز ---
Write-Step "ایجاد پوشه‌های داده..."
@("logs\nginx", "media", "static", "database\backups") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

# --- ساخت و اجرا ---
Write-Step "ساخت imageها (ممکن است چند دقیقه طول بکشد)..."
docker compose build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Step "اجرای سرویس‌ها..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- انتظار برای backend ---
Write-Step "انتظار برای آماده‌شدن backend..."
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
    Write-Host "  ... در حال انتظار ($elapsed ثانیه)" -ForegroundColor DarkGray
}

if (-not $healthy) {
    Write-Host "هشدار: backend هنوز healthy نشده. لاگ را بررسی کنید:" -ForegroundColor Yellow
    Write-Host "  docker logs volunteer-management-backend" -ForegroundColor Yellow
} else {
    Write-Host "Backend آماده است." -ForegroundColor Green
}

# --- Seed ---
Write-Step "بارگذاری داده‌های اولیه..."
docker compose exec -T volunteer-management-backend python manage.py seed_data 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "داده‌های پایه (نقش‌ها، دسترسی‌ها، ادمین) بارگذاری شد." -ForegroundColor Green
}

Write-Step "بارگذاری سناریوی دمو (اختیاری)..."
docker compose exec -T volunteer-management-backend python manage.py seed_demo 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "سناریوی دمو (بحران + مأموریت) بارگذاری شد." -ForegroundColor Green
}

# --- نتیجه ---
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "   راه‌اندازی با موفقیت انجام شد!" -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  برنامه:        http://localhost" -ForegroundColor White
Write-Host "  API Docs:      http://localhost/api/docs/" -ForegroundColor White
Write-Host "  PgAdmin:       http://localhost:5050" -ForegroundColor White
Write-Host "  Mailhog:       http://localhost:8025" -ForegroundColor White
Write-Host ""
Write-Host "  Admin email:   InvesticaCO@gmail.com" -ForegroundColor Yellow
Write-Host "  Password:      Investica003" -ForegroundColor Yellow
Write-Host ""
Write-Host "  برای توقف:     Stop.bat" -ForegroundColor DarkGray
Write-Host "  برای اجرا:     Start.bat" -ForegroundColor DarkGray
Write-Host ""
