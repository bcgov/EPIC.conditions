# Master Deployment Orchestration Script
# Runs the full deployment sequence for condition-extractor.
#
# Usage:
#   .\scripts\deploy.ps1                              # Full first-time deployment
#   .\scripts\deploy.ps1 -SkipInfra -SkipWebApp      # Re-deploy image + settings only
#   .\scripts\deploy.ps1 -SkipInfra                  # Infra exists, re-deploy app only
#   .\scripts\deploy.ps1 -EnvFile my.env

param(
    [string]$EnvFile   = "deploy.env",
    [switch]$SkipInfra,
    [switch]$SkipWebApp
)

$timestamp  = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile    = "deploy-$timestamp.log"
$scriptRoot = $PSScriptRoot

Start-Transcript -Path $logFile

Write-Host "=== Condition Extractor - Full Deployment ===" -ForegroundColor Cyan
Write-Host "Started : $(Get-Date)"
Write-Host "Log file: $logFile"
Write-Host ""

# Prerequisites
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "Not logged in - running az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) { Stop-Transcript; exit 1 }
}
Write-Host "Subscription: $(az account show --query name --output tsv)" -ForegroundColor Green

docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker Desktop is not running." -ForegroundColor Red
    Stop-Transcript; exit 1
}
Write-Host "Docker   : running" -ForegroundColor Green
Write-Host ""

# ---- Step 1: Networking -------------------------------------------------------
if ($SkipInfra) {
    Write-Host "[SKIP] Step 1: Networking (already exists)" -ForegroundColor Yellow
} else {
    Write-Host "=== Step 1: Networking setup ===" -ForegroundColor Cyan
    & "$scriptRoot\networking-setup.ps1" -EnvFile $EnvFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL Step 1" -ForegroundColor Red
        Stop-Transcript; exit 1
    }
    Write-Host "PASS Step 1" -ForegroundColor Green
    Write-Host ""
}

# ---- Step 2: Azure OpenAI -----------------------------------------------------
if ($SkipInfra) {
    Write-Host "[SKIP] Step 2: Azure OpenAI (already exists)" -ForegroundColor Yellow
} else {
    Write-Host "=== Step 2: Deploy Azure OpenAI ===" -ForegroundColor Cyan
    & "$scriptRoot\openai-deploy.ps1" -EnvFile $EnvFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL Step 2" -ForegroundColor Red
        Stop-Transcript; exit 1
    }
    Write-Host "PASS Step 2" -ForegroundColor Green
    Write-Host ""
}

# ---- Step 3: Private endpoint + DNS ------------------------------------------
if ($SkipInfra) {
    Write-Host "[SKIP] Step 3: Private endpoint (already exists)" -ForegroundColor Yellow
} else {
    Write-Host "=== Step 3: Private endpoint + DNS ===" -ForegroundColor Cyan
    & "$scriptRoot\private-endpoint-deploy.ps1" -EnvFile $EnvFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL Step 3" -ForegroundColor Red
        Stop-Transcript; exit 1
    }
    Write-Host "PASS Step 3" -ForegroundColor Green
    Write-Host ""

    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host "ACTION REQUIRED" -ForegroundColor Yellow
    Write-Host "Step 2 printed your AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY above." -ForegroundColor Yellow
    Write-Host "Update $EnvFile with those values before continuing." -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Read-Host "Press Enter once deploy.env is updated"
    Write-Host ""
}

# ---- Step 4: Build and push image --------------------------------------------
Write-Host "=== Step 4: Build and push Docker image ===" -ForegroundColor Cyan
& "$scriptRoot\acr-push.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL Step 4" -ForegroundColor Red
    Stop-Transcript; exit 1
}
Write-Host "PASS Step 4" -ForegroundColor Green
Write-Host ""

# ---- Step 5: App Service + VNet integration ----------------------------------
if ($SkipWebApp) {
    Write-Host "[SKIP] Step 5: App Service (already exists)" -ForegroundColor Yellow
} else {
    Write-Host "=== Step 5: Deploy App Service + VNet integration ===" -ForegroundColor Cyan
    & "$scriptRoot\webapp-deploy.ps1" -EnvFile $EnvFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL Step 5" -ForegroundColor Red
        Stop-Transcript; exit 1
    }
    Write-Host "PASS Step 5" -ForegroundColor Green
    Write-Host ""
}

# ---- Step 6: Configure settings ----------------------------------------------
Write-Host "=== Step 6: Configure Application Settings ===" -ForegroundColor Cyan
& "$scriptRoot\configure-settings.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL Step 6" -ForegroundColor Red
    Stop-Transcript; exit 1
}
Write-Host "PASS Step 6" -ForegroundColor Green
Write-Host ""

# ---- Step 7: Smoke test ------------------------------------------------------
Write-Host "=== Step 7: End-to-end API test ===" -ForegroundColor Cyan
& "$scriptRoot\test-api.ps1" -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAIL Step 7" -ForegroundColor Red
    Stop-Transcript; exit 1
}
Write-Host "PASS Step 7" -ForegroundColor Green
Write-Host ""

Write-Host "=== Deployment succeeded ===" -ForegroundColor Green
Stop-Transcript
