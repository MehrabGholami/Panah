# Restore PostgreSQL database from a backup file.
# Usage: .\infrastructure\scripts\restore-db.ps1 .\database\backups\file.sql.gz

param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$BackupFile = ""
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$BackupDir = Join-Path $ProjectRoot "database\backups"

$Container = if ($env:POSTGRES_CONTAINER) { $env:POSTGRES_CONTAINER } else { "volunteer-management-postgres" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "volunteer_management" }
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "volunteer_user" }

if (-not $BackupFile) {
    Write-Host "Available backups:"
    Get-ChildItem -Path $BackupDir -Filter "*.sql.gz" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        ForEach-Object { Write-Host "  $($_.FullName)" }
    Write-Host ""
    Write-Error "Usage: .\infrastructure\scripts\restore-db.ps1 <backup_file.sql.gz>"
    exit 1
}

if (-not (Test-Path -LiteralPath $BackupFile)) {
    Write-Error "Error: backup file not found: $BackupFile"
    exit 1
}

$running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $Container }
if (-not $running) {
    Write-Error "Error: container '$Container' is not running."
    exit 1
}

Write-Host "WARNING: This will replace all data in database '$DbName'."
$Confirm = Read-Host "Type '$DbName' to confirm"
if ($Confirm -ne $DbName) {
    Write-Host "Aborted."
    exit 1
}

Write-Host "Terminating active connections..."
docker exec -t $Container psql -U $DbUser -d postgres -c `
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();" | Out-Null

Write-Host "Dropping and recreating database..."
docker exec -t $Container psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS `"$DbName`";"
docker exec -t $Container psql -U $DbUser -d postgres -c "CREATE DATABASE `"$DbName`" OWNER `"$DbUser`";"

Write-Host "Restoring from $BackupFile..."
$py = @"
import gzip, subprocess, sys
data = gzip.open(r'''$BackupFile''', 'rb').read()
proc = subprocess.run(
    ['docker', 'exec', '-i', r'''$Container''', 'psql', '-U', r'''$DbUser''', '-d', r'''$DbName'''],
    input=data,
)
sys.exit(proc.returncode)
"@
python -c $py
if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore failed."
    exit $LASTEXITCODE
}

Write-Host "Restore complete."
Write-Host "Next: run migrations if needed:"
Write-Host "  docker compose exec volunteer-management-backend python manage.py migrate"
