# scripts/reinstall.ps1
# Limpieza completa y reinstalación de dependencias (Windows).
# Soluciona errores como "Electron failed to install correctly".

$ErrorActionPreference = "Stop"
# Raíz del proyecto = carpeta que contiene scripts/
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    $ProjectRoot = (Get-Location).Path
}
Set-Location $ProjectRoot

Write-Host "Proyecto: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

# 1) Borrar node_modules
if (Test-Path "node_modules") {
    Write-Host "Eliminando node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "  listo." -ForegroundColor Green
} else {
    Write-Host "No existe node_modules." -ForegroundColor Gray
}

# 2) Borrar package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "Eliminando package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
    Write-Host "  listo." -ForegroundColor Green
} else {
    Write-Host "No existe package-lock.json." -ForegroundColor Gray
}

# 3) Limpiar caché npm (opcional: descomenta la siguiente línea si quieres forzarlo)
# Write-Host "Limpiando caché npm..." -ForegroundColor Yellow
# npm cache clean --force
# Write-Host "  listo." -ForegroundColor Green

# 4) Limpiar dist
if (Test-Path "dist") {
    Write-Host "Eliminando dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
    Write-Host "  listo." -ForegroundColor Green
}

Write-Host ""
Write-Host "Reinstalando dependencias (npm install)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en npm install." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Recompilando módulos nativos para Electron (better-sqlite3)..." -ForegroundColor Cyan
npm run rebuild:native
if ($LASTEXITCODE -ne 0) {
    Write-Host "Advertencia: rebuild:native falló. Ejecuta 'npm run rebuild:native' manualmente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Reinstalación completada. Ejecuta: npm run start" -ForegroundColor Green
