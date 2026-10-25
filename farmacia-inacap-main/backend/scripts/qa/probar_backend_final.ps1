$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"

Write-Host "Login..." -ForegroundColor Cyan
$login = Invoke-RestMethod `
  -Uri "$base/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"administrador"}'

$h = @{ Authorization = "Bearer $($login.accessToken)" }

function Test-Endpoint($label, $uri) {
  Write-Host "$label..." -ForegroundColor Cyan
  $r = Invoke-RestMethod -Uri $uri -Headers $h
  if (-not $r.ok) { throw "$label respondió ok=false" }
  Write-Host "OK - $label" -ForegroundColor Green
}

Test-Endpoint "Pacientes" "$base/patients?limit=5"
Test-Endpoint "Medicos" "$base/doctors?limit=5"
Test-Endpoint "Recetas" "$base/prescriptions?limit=5"
Test-Endpoint "Controlados" "$base/controlled-drugs?limit=5"
Test-Endpoint "Convenios" "$base/agreements"
Test-Endpoint "Dashboard" "$base/reports/dashboard"
Test-Endpoint "Reporte ventas" "$base/reports/sales"
Test-Endpoint "Reporte inventario" "$base/reports/inventory"
Test-Endpoint "Reporte compras" "$base/reports/purchases"
Test-Endpoint "Reporte caja" "$base/reports/cash"
Test-Endpoint "Reporte controlados" "$base/reports/controlled"
Test-Endpoint "Auditoria" "$base/reports/audit?limit=5"
Test-Endpoint "Configuracion" "$base/settings"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host " BACKEND FUNCIONAL COMPLETO - PRUEBAS BASE CORRECTAS" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente etapa: FRONTEND REACT." -ForegroundColor Yellow
