# Backup PostgreSQL database to database/backups/
# Usage: .\infrastructure\scripts\backup-db.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$BackupDir = Join-Path $ProjectRoot "database\backups"

$Container = if ($env:POSTGRES_CONTAINER) { $env:POSTGRES_CONTAINER } else { "volunteer-management-postgres" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "volunteer_management" }
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "volunteer_user" }
$RetentionDays = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $Container }
if (-not $running) {
    Write-Error "Error: container '$Container' is not running."
    exit 1
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "${DbName}_${Timestamp}.sql.gz"

Write-Host "Backing up $DbName from $Container..."
docker exec -t $Container pg_dump -U $DbUser -d $DbName --no-owner --no-acl | gzip > $BackupFile
Write-Host "Backup saved: $BackupFile"

$Cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "${DbName}_*.sql.gz" -File |
    Where-Object { $_.LastWriteTime -lt $Cutoff } |
    Remove-Item -Force
