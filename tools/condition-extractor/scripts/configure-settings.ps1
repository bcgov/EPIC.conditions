# Configure Azure App Service Application Settings
# Sets all environment variables the container needs at runtime.
# Safe to re-run - updates settings in place and restarts the app.
#
# Usage:
#   .\scripts\configure-settings.ps1                   # Uses deploy.env
#   .\scripts\configure-settings.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - Configure Settings ===" -ForegroundColor Cyan

# -- Load env file --------------------------------------------------------------
if (-not (Test-Path $EnvFile)) {
    Write-Error "Environment file '$EnvFile' not found."
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)\s*$') {
        $name  = $matches[1].Trim()
        $value = $matches[2].Trim() -replace "^[`"']|[`"']`$", ''
        Set-Variable -Name $name -Value $value -Scope Script
        Write-Host "  Loaded: $name" -ForegroundColor Green
    }
}

# -- Validate -------------------------------------------------------------------
foreach ($required in @('AZURE_RESOURCE_GROUP', 'AZURE_APP_NAME', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT', 'API_KEY')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

Write-Host "`nConfiguring App Service: $AZURE_APP_NAME" -ForegroundColor White
Write-Host "Resource Group         : $AZURE_RESOURCE_GROUP" -ForegroundColor White

# -- Apply settings -------------------------------------------------------------
Write-Host "`nApplying Application Settings..." -ForegroundColor Cyan

az webapp config appsettings set `
    --resource-group $AZURE_RESOURCE_GROUP `
    --name          $AZURE_APP_NAME `
    --settings `
        AZURE_OPENAI_API_KEY="$AZURE_OPENAI_API_KEY" `
        AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" `
        AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" `
        AZURE_OPENAI_API_VERSION="$AZURE_OPENAI_API_VERSION" `
        API_KEY="$API_KEY" `
        PORT="$PORT" `
        WEBSITES_PORT="$PORT"

if ($LASTEXITCODE -ne 0) { Write-Error "Failed to apply Application Settings."; exit 1 }
Write-Host "Settings applied." -ForegroundColor Green

# -- Restart --------------------------------------------------------------------
Write-Host "`nRestarting App Service..." -ForegroundColor Cyan
az webapp restart --resource-group $AZURE_RESOURCE_GROUP --name $AZURE_APP_NAME
if ($LASTEXITCODE -ne 0) { Write-Error "Restart failed."; exit 1 }
Write-Host "App Service restarted." -ForegroundColor Green

# -- Health check ---------------------------------------------------------------
$appUrl = az webapp show `
    --resource-group $AZURE_RESOURCE_GROUP `
    --name          $AZURE_APP_NAME `
    --query         defaultHostName `
    --output        tsv

Write-Host "`nHealth check: https://$appUrl/health" -ForegroundColor Cyan
Start-Sleep -Seconds 8

try {
    $response = Invoke-RestMethod -Uri "https://$appUrl/health" -Method Get -TimeoutSec 20
    if ($response.status -eq "ok") {
        Write-Host "`n=== Settings Configured Successfully ===" -ForegroundColor Green
        Write-Host "API is live at: https://$appUrl" -ForegroundColor White
    } else {
        Write-Warning "Health check returned unexpected response: $response"
    }
} catch {
    Write-Warning "Health check failed (app may still be starting): $_"
    Write-Host "Check manually: https://$appUrl/health" -ForegroundColor Yellow
}
