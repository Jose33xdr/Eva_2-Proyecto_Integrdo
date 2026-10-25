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

Write-Host "Proveedores..." -ForegroundColor Cyan
$suppliers = Invoke-RestMethod -Uri "$base/suppliers?limit=5" -Headers $headers
Write-Host "OK - proveedores: $($suppliers.meta.total)" -ForegroundColor Green

Write-Host "Ordenes de compra..." -ForegroundColor Cyan
$orders = Invoke-RestMethod -Uri "$base/purchases?limit=5" -Headers $headers
Write-Host "OK - ordenes: $($orders.meta.total)" -ForegroundColor Green

Write-Host "Ubicaciones..." -ForegroundColor Cyan
$locations = Invoke-RestMethod -Uri "$base/inventory/locations" -Headers $headers
Write-Host "OK - ubicaciones: $($locations.locations.Count)" -ForegroundColor Green

Write-Host "Stock..." -ForegroundColor Cyan
$stock = Invoke-RestMethod -Uri "$base/inventory/stock?limit=5" -Headers $headers
Write-Host "OK - registros stock: $($stock.meta.total)" -ForegroundColor Green

Write-Host "Lotes..." -ForegroundColor Cyan
$batches = Invoke-RestMethod -Uri "$base/inventory/batches?limit=5" -Headers $headers
Write-Host "OK - lotes: $($batches.meta.total)" -ForegroundColor Green

Write-Host "Alertas..." -ForegroundColor Cyan
$alerts = Invoke-RestMethod -Uri "$base/inventory/alerts" -Headers $headers
Write-Host "OK - alertas: $($alerts.alerts.Count)" -ForegroundColor Green

Write-Host ""
Write-Host "TODOS LOS ENDPOINTS DE COMPRAS E INVENTARIO RESPONDEN CORRECTAMENTE." -ForegroundColor Green
