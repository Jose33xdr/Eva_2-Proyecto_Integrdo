$ErrorActionPreference = "Stop"

$base = "http://localhost:3000/api"

Write-Host "Login..." -ForegroundColor Cyan
$login = Invoke-RestMethod `
  -Uri "$base/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"administrador"}'

$headers = @{
  Authorization = "Bearer $($login.accessToken)"
}

Write-Host "Cajas..." -ForegroundColor Cyan
$registers = Invoke-RestMethod -Uri "$base/cash/registers" -Headers $headers
Write-Host "OK - cajas: $($registers.registers.Count)" -ForegroundColor Green

if ($registers.registers.Count -lt 1) {
  throw "No existe ninguna caja. Ejecuta: npx tsx preparar_pos.ts"
}

$registerId = $registers.registers[0].id

Write-Host "Sesiones..." -ForegroundColor Cyan
$sessions = Invoke-RestMethod -Uri "$base/cash/sessions?limit=10" -Headers $headers
Write-Host "OK - sesiones: $($sessions.sessions.Count)" -ForegroundColor Green

$open = $sessions.sessions | Where-Object {
  $_.cashRegisterId -eq $registerId -and $_.status -eq "OPEN"
} | Select-Object -First 1

if (-not $open) {
  Write-Host "Abriendo caja de prueba..." -ForegroundColor Cyan

  $body = @{
    cashRegisterId = $registerId
    openingAmount = 50000
    notes = "Apertura automática de prueba"
  } | ConvertTo-Json

  $opened = Invoke-RestMethod `
    -Uri "$base/cash/sessions/open" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body

  $open = $opened.session
}

Write-Host "OK - sesión abierta: $($open.id)" -ForegroundColor Green

Write-Host "Detalle de sesión..." -ForegroundColor Cyan
$sessionDetail = Invoke-RestMethod `
  -Uri "$base/cash/sessions/$($open.id)" `
  -Headers $headers

Write-Host "OK - efectivo esperado: $($sessionDetail.expectedAmount)" -ForegroundColor Green

Write-Host "Ventas..." -ForegroundColor Cyan
$sales = Invoke-RestMethod -Uri "$base/sales?limit=5" -Headers $headers
Write-Host "OK - ventas registradas: $($sales.meta.total)" -ForegroundColor Green

Write-Host ""
Write-Host "POS / CAJA / VENTAS RESPONDEN CORRECTAMENTE." -ForegroundColor Green
Write-Host ""
Write-Host "Nota: no se crea una venta automática porque todavía no hay productos/lotes cargados." -ForegroundColor Yellow
