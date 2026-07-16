#Requires -Version 5.1
<#
.SYNOPSIS
    توقف Volunteer Management Platform
#>
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host ""
Write-Host "  در حال توقف سامانه..." -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker یافت نشد." -ForegroundColor Yellow
    exit 0
}

docker compose down
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "  سامانه متوقف شد." -ForegroundColor Green
Write-Host "  (داده‌ها و volumeها حفظ شده‌اند)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  برای اجرای مجدد: Start.bat" -ForegroundColor DarkGray
Write-Host ""
