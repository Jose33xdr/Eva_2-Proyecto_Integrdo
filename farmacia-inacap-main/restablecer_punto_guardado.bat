@echo off
echo Restableciendo base de datos al punto guardado...
docker exec -i farmacia_postgres psql -U farmacia_user -d farmacia_db < "%~dp0backup_punto_restablecer.sql"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Base de datos restablecida correctamente al punto guardado.
) else (
    echo.
    echo [ERROR] Hubo un problema al restablecer la base de datos.
)
pause
