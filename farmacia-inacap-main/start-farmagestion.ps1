$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$ngrokDomain = "terse-nonabiding-creola.ngrok-free.dev"

if (-not (Test-Path $backend)) {
    Write-Host "No existe el backend: $backend" -ForegroundColor Red
    Read-Host "ENTER para salir"
    exit 1
}

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrok) {
    Write-Host "ngrok no está instalado o no está en PATH." -ForegroundColor Red
    Write-Host "Instálalo y autentícalo antes de ejecutar este script." -ForegroundColor Yellow
    Read-Host "ENTER para salir"
    exit 1
}

Write-Host ""
Write-Host "FarmaGestión" -ForegroundColor Green
Write-Host "Backend:       http://localhost:3000"
Write-Host "Health local:  http://localhost:3000/api/health"
Write-Host "API pública:   https://$ngrokDomain/api"
Write-Host "Health público:https://$ngrokDomain/api/health"
Write-Host ""

$backendCommand = "Set-Location '$backend'; npm run dev"
$ngrokCommand = "ngrok http --domain=$ngrokDomain 3000"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $backendCommand
)

Start-Sleep -Seconds 3

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $ngrokCommand
)

Write-Host "Backend y ngrok iniciados en ventanas separadas." -ForegroundColor Green
