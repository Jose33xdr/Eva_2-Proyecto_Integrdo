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

Write-Host "Usuarios..." -ForegroundColor Cyan
$users = Invoke-RestMethod -Uri "$base/users?limit=5" -Headers $headers
Write-Host "OK - usuarios: $($users.meta.total)" -ForegroundColor Green

Write-Host "Roles..." -ForegroundColor Cyan
$roles = Invoke-RestMethod -Uri "$base/access/roles" -Headers $headers
Write-Host "OK - roles: $($roles.roles.Count)" -ForegroundColor Green

Write-Host "Permisos..." -ForegroundColor Cyan
$permissions = Invoke-RestMethod -Uri "$base/access/permissions" -Headers $headers
Write-Host "OK - permisos: $($permissions.permissions.Count)" -ForegroundColor Green

Write-Host "Categorias..." -ForegroundColor Cyan
$categories = Invoke-RestMethod -Uri "$base/categories?limit=10" -Headers $headers
Write-Host "OK - categorias: $($categories.meta.total)" -ForegroundColor Green

Write-Host "Laboratorios..." -ForegroundColor Cyan
$labs = Invoke-RestMethod -Uri "$base/laboratories?limit=10" -Headers $headers
Write-Host "OK - laboratorios: $($labs.meta.total)" -ForegroundColor Green

Write-Host "Principios activos..." -ForegroundColor Cyan
$ingredients = Invoke-RestMethod -Uri "$base/active-ingredients?limit=10" -Headers $headers
Write-Host "OK - principios activos: $($ingredients.meta.total)" -ForegroundColor Green

Write-Host "Productos..." -ForegroundColor Cyan
$products = Invoke-RestMethod -Uri "$base/products?limit=10" -Headers $headers
Write-Host "OK - productos: $($products.meta.total)" -ForegroundColor Green

Write-Host ""
Write-Host "TODOS LOS ENDPOINTS BASE RESPONDEN CORRECTAMENTE." -ForegroundColor Green
