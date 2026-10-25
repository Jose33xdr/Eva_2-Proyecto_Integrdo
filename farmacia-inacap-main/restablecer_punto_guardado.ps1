$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backupFile = Join-Path $root "backup_punto_restablecer.sql"

if (-not (Test-Path $backupFile)) {
    Write-Host "[ERROR] No se encontró el archivo de respaldo: $backupFile" -ForegroundColor Red
    exit 1
}

Write-Host "Restableciendo base de datos al punto guardado..." -ForegroundColor Cyan
Get-Content $backupFile -Raw | docker exec -i farmacia_postgres psql -U farmacia_user -d farmacia_db

Write-Host ""
Write-Host "[OK] Base de datos restablecida correctamente al punto guardado." -ForegroundColor Green
