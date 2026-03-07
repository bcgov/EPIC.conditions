# Azure Web App Deploy Script
# Creates the App Service and wires it to ACR - idempotent (safe to re-run).
# Handles: App Service creation, Managed Identity, AcrPull role, container config.
# Modelled on the RECAP webapp-deploy.ps1 pattern.
#
# Usage (one-time setup, run AFTER acr-push.ps1):
#   .\scripts\webapp-deploy.ps1                   # Uses deploy.env by default
#   .\scripts\webapp-deploy.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - Web App Deploy ===" -ForegroundColor Cyan

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
    }
}

# -- Validate -------------------------------------------------------------------
foreach ($required in @('AZURE_RESOURCE_GROUP', 'AZURE_APP_SERVICE_PLAN', 'AZURE_APP_NAME', 'DOCKER_REGISTRY', 'DOCKER_REPOSITORY', 'VNET_RESOURCE_GROUP', 'VNET_NAME', 'WEBAPP_SUBNET_NAME')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

$resourceGroup   = $AZURE_RESOURCE_GROUP
$appServicePlan  = $AZURE_APP_SERVICE_PLAN
$appName         = $AZURE_APP_NAME
$registry        = $DOCKER_REGISTRY
$repository      = $DOCKER_REPOSITORY
$acrName         = if ($ACR_NAME) { $ACR_NAME } else { ($registry -split '\.')[0] }
$acrSubscription = $ACR_SUBSCRIPTION
$fullImage       = "$registry/$repository`:latest"

Write-Host "Resource Group : $resourceGroup" -ForegroundColor White
Write-Host "App Service Plan: $appServicePlan" -ForegroundColor White
Write-Host "App Name       : $appName" -ForegroundColor White
Write-Host "Image          : $fullImage" -ForegroundColor White

# -- Check Azure login ----------------------------------------------------------
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "Not logged in to Azure - running az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) { Write-Error "Azure login failed."; exit 1 }
}

# -- Step 1: App Service Plan (create if not exists) ---------------------------
Write-Host "`nChecking App Service Plan: $appServicePlan..." -ForegroundColor Yellow
$aspCheck = az appservice plan show --name $appServicePlan --resource-group $resourceGroup 2>$null
if (-not $aspCheck) {
    Write-Host "Creating App Service Plan (Linux, B2)..." -ForegroundColor Yellow
    az appservice plan create `
        --name          $appServicePlan `
        --resource-group $resourceGroup `
        --is-linux `
        --sku B1
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create App Service Plan."; exit 1 }
    Write-Host "App Service Plan created." -ForegroundColor Green
} else {
    Write-Host "App Service Plan already exists." -ForegroundColor Green
}

# -- Step 2: Web App (create if not exists) ------------------------------------
Write-Host "`nChecking Web App: $appName..." -ForegroundColor Yellow
$webAppCheck = az webapp show --name $appName --resource-group $resourceGroup 2>$null
if (-not $webAppCheck) {
    Write-Host "Creating Web App..." -ForegroundColor Yellow
    az webapp create `
        --name           $appName `
        --resource-group $resourceGroup `
        --plan           $appServicePlan `
        --deployment-container-image-name mcr.microsoft.com/appsvc/staticsite:latest `
        --https-only true
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create Web App."; exit 1 }
    Write-Host "Web App created." -ForegroundColor Green
} else {
    Write-Host "Web App already exists." -ForegroundColor Green
}

# -- Step 3: Enable Managed Identity -------------------------------------------
Write-Host "`nEnabling Managed Identity..." -ForegroundColor Yellow
$identityJson = az webapp identity assign `
    --name           $appName `
    --resource-group $resourceGroup `
    --output json 2>$null

if ($LASTEXITCODE -ne 0) { Write-Error "Failed to enable Managed Identity."; exit 1 }

$principalId = ($identityJson | ConvertFrom-Json).principalId
Write-Host "Managed Identity principal: $principalId" -ForegroundColor Green

# -- Step 4: Grant AcrPull role ------------------------------------------------
Write-Host "`nGranting AcrPull role on $acrName..." -ForegroundColor Yellow
if ($acrSubscription) {
    $acrId = az acr show --name $acrName --subscription $acrSubscription --query id --output tsv 2>$null
} else {
    $acrId = az acr show --name $acrName --query id --output tsv 2>$null
}
if (-not $acrId) {
    Write-Error "Could not find ACR '$acrName'. Check ACR_NAME/DOCKER_REGISTRY in $EnvFile."
    exit 1
}

# Check if role already assigned
$existingRole = az role assignment list `
    --assignee $principalId `
    --role AcrPull `
    --scope $acrId `
    --query "[0].id" --output tsv 2>$null

if (-not $existingRole) {
    az role assignment create `
        --assignee $principalId `
        --role     AcrPull `
        --scope    $acrId
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to grant AcrPull role."; exit 1 }
    Write-Host "AcrPull role granted." -ForegroundColor Green
} else {
    Write-Host "AcrPull role already assigned." -ForegroundColor Green
}

# -- Step 5: Configure container image -----------------------------------------
# Auth strategy:
#   Same-subscription ACR  → managed identity (acrUseManagedIdentityCreds)
#   Cross-subscription ACR → set DOCKER_REGISTRY_SERVER_PASSWORD in deploy.env to use admin credentials
#     (cross-subscription managed identity token exchange is not supported by Azure App Service)
Write-Host "`nConfiguring container image: $fullImage..." -ForegroundColor Yellow

if ($DOCKER_REGISTRY_SERVER_PASSWORD) {
    # Admin credential mode (required when ACR is in a different subscription)
    Write-Host "  Using registry admin credentials (cross-subscription mode)." -ForegroundColor Yellow
    az webapp config container set `
        --name           $appName `
        --resource-group $resourceGroup `
        --docker-custom-image-name       $fullImage `
        --docker-registry-server-url     "https://$registry" `
        --docker-registry-server-user    $DOCKER_REGISTRY_SERVER_USERNAME `
        --docker-registry-server-password $DOCKER_REGISTRY_SERVER_PASSWORD
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to configure container image."; exit 1 }
    # Ensure managed identity credential mode is off (would conflict with explicit credentials)
    az webapp config set `
        --name           $appName `
        --resource-group $resourceGroup `
        --generic-configurations '{\"acrUseManagedIdentityCreds\": false}' | Out-Null
} else {
    # Managed identity mode (ACR must be in the same subscription)
    Write-Host "  Using managed identity credentials (same-subscription mode)." -ForegroundColor Yellow
    az webapp config container set `
        --name           $appName `
        --resource-group $resourceGroup `
        --docker-custom-image-name    $fullImage `
        --docker-registry-server-url  "https://$registry"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to configure container image."; exit 1 }
    az webapp config set `
        --name           $appName `
        --resource-group $resourceGroup `
        --generic-configurations '{\"acrUseManagedIdentityCreds\": true}' | Out-Null
}

Write-Host "Container image configured." -ForegroundColor Green

# -- Step 6: VNet integration ---------------------------------------------------
# Required so the App Service can reach Azure OpenAI via its private endpoint.
Write-Host "`nConfiguring VNet integration..." -ForegroundColor Yellow
$subnetId = az network vnet subnet show `
    --name           $WEBAPP_SUBNET_NAME `
    --vnet-name      $VNET_NAME `
    --resource-group $VNET_RESOURCE_GROUP `
    --query          "id" --output tsv

if (-not $subnetId) {
    Write-Error "Webapp subnet '$WEBAPP_SUBNET_NAME' not found. Run networking-setup.ps1 first."
    exit 1
}

$existingVnetInt = az webapp vnet-integration list --name $appName --resource-group $resourceGroup --query "[0].id" --output tsv 2>$null
if (-not $existingVnetInt) {
    az webapp vnet-integration add `
        --name           $appName `
        --resource-group $resourceGroup `
        --vnet           $VNET_NAME `
        --subnet         $subnetId
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to configure VNet integration."; exit 1 }
    Write-Host "VNet integration configured." -ForegroundColor Green
} else {
    Write-Host "VNet integration already configured." -ForegroundColor Green
}

# Route all outbound traffic through the VNet (needed for private DNS resolution of OpenAI endpoint)
az webapp config set `
    --name           $appName `
    --resource-group $resourceGroup `
    --generic-configurations '{\"vnetRouteAllEnabled\": true}'
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to enable vnetRouteAllEnabled."; exit 1 }

Write-Host "`n=== Web App Deploy Complete ===" -ForegroundColor Green
Write-Host "Web App URL: https://$appName.azurewebsites.net" -ForegroundColor White
Write-Host "`nNext: run .\scripts\configure-settings.ps1 to set environment variables."
exit 0
