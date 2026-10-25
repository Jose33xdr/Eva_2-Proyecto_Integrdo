$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " FARMA GESTION - VERIFICACION DE CONEXION" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$localUrl = "http://localhost:3000/api/health"
$publicUrl = "https://terse-nonabiding-creola.ngrok-free.dev/api/health"

try {

    $local = Invoke-RestMethod `
        -Uri $localUrl `
        -Method GET `
        -TimeoutSec 10

    if ($local.ok -eq $true) {

        Write-Host "[OK] Backend local" -ForegroundColor Green
        Write-Host "     $localUrl"
        Write-Host "     Database connected: $($local.database.connected)"
    }
    else {

        Write-Host "[ERROR] Backend local respondió pero sin ok=true" -ForegroundColor Red
    }

}
catch {

    Write-Host "[ERROR] Backend local" -ForegroundColor Red
    Write-Host "        $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

try {

    $public = Invoke-RestMethod `
        -Uri $publicUrl `
        -Method GET `
        -Headers @{
            "ngrok-skip-browser-warning" = "true"
        } `
        -TimeoutSec 15

    if ($public.ok -eq $true) {

        Write-Host "[OK] Backend público ngrok" -ForegroundColor Green
        Write-Host "     $publicUrl"
        Write-Host "     Service: $($public.service)"
        Write-Host "     Database connected: $($public.database.connected)"
    }
    else {

        Write-Host "[ERROR] ngrok respondió pero sin ok=true" -ForegroundColor Red
    }

}
catch {

    Write-Host "[ERROR] Backend público ngrok" -ForegroundColor Red
    Write-Host "        $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""