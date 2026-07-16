#Requires -Version 5.1
<#
.SYNOPSIS
    اجرای Volunteer Management Platform
#>
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  در حال اجرای سامانه..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "خطا: Docker نصب نیست. ابتدا SETUP.bat را اجرا کنید." -ForegroundColor Red
    exit 1
}

try {
    docker info 2>$null | Out-Null
} catch {
    Write-Host "خطا: Docker در حال اجرا نیست. Docker Desktop را باز کنید." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "فایل .env یافت نشد. ابتدا SETUP.bat را اجرا کنید." -ForegroundColor Yellow
    exit 1
}

docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "  سامانه در حال اجراست." -ForegroundColor Green
Write-Host ""
Write-Host "  برنامه:    http://localhost" -ForegroundColor White
Write-Host "  API Docs:  http://localhost/api/docs/" -ForegroundColor White
Write-Host ""

docker compose ps --format "table {{.Name}}\t{{.Status}}"

Write-Host ""
