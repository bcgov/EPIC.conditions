# Networking Setup for Condition Extractor
# Creates NSGs and subnets inside the BC Gov landing zone spoke VNet.
# The VNet itself is pre-existing (managed by the landing zone).
# Safe to re-run - skips resources that already exist.
#
# Usage:
#   .\scripts\networking-setup.ps1                   # Uses deploy.env
#   .\scripts\networking-setup.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - Networking Setup ===" -ForegroundColor Cyan

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
foreach ($required in @('VNET_RESOURCE_GROUP', 'VNET_NAME', 'PE_SUBNET_NAME', 'PE_SUBNET_PREFIX', 'WEBAPP_SUBNET_NAME', 'WEBAPP_SUBNET_PREFIX')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

# NSGs must be in the same region as the VNet - derive it automatically
$vnetLocation = az network vnet show --name $VNET_NAME --resource-group $VNET_RESOURCE_GROUP --query "location" --output tsv
Write-Host "VNet RG       : $VNET_RESOURCE_GROUP" -ForegroundColor White
Write-Host "VNet          : $VNET_NAME (location: $vnetLocation)" -ForegroundColor White
Write-Host "PE Subnet     : $PE_SUBNET_NAME ($PE_SUBNET_PREFIX)" -ForegroundColor White
Write-Host "WebApp Subnet : $WEBAPP_SUBNET_NAME ($WEBAPP_SUBNET_PREFIX)" -ForegroundColor White

# -- Step 1: NSG for private endpoint subnet -----------------------------------
Write-Host "`nStep 1: NSG for private endpoint subnet..." -ForegroundColor Cyan
$peNsgName = "$PE_SUBNET_NAME-nsg"
$existingNsg = az network nsg show --name $peNsgName --resource-group $VNET_RESOURCE_GROUP 2>$null
if (-not $existingNsg) {
    az network nsg create `
        --name           $peNsgName `
        --resource-group $VNET_RESOURCE_GROUP `
        --location       $vnetLocation
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create PE NSG."; exit 1 }
    Write-Host "PE NSG created." -ForegroundColor Green
} else {
    Write-Host "PE NSG already exists." -ForegroundColor Green
}

# -- Step 2: NSG for web app integration subnet --------------------------------
Write-Host "`nStep 2: NSG for web app integration subnet..." -ForegroundColor Cyan
$webappNsgName = "$WEBAPP_SUBNET_NAME-nsg"
$existingWebNsg = az network nsg show --name $webappNsgName --resource-group $VNET_RESOURCE_GROUP 2>$null
if (-not $existingWebNsg) {
    az network nsg create `
        --name           $webappNsgName `
        --resource-group $VNET_RESOURCE_GROUP `
        --location       $vnetLocation
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create WebApp NSG."; exit 1 }

    # Allow outbound from webapp subnet to PE subnet on 443
    az network nsg rule create `
        --name                      "Allow-To-PrivateEndpoint" `
        --nsg-name                  $webappNsgName `
        --resource-group            $VNET_RESOURCE_GROUP `
        --priority                  1000 `
        --source-address-prefixes   $WEBAPP_SUBNET_PREFIX `
        --destination-address-prefixes $PE_SUBNET_PREFIX `
        --destination-port-ranges   443 `
        --access                    Allow `
        --protocol                  Tcp `
        --direction                 Outbound
    Write-Host "WebApp NSG created." -ForegroundColor Green
} else {
    Write-Host "WebApp NSG already exists." -ForegroundColor Green
}

# -- Step 3: Private endpoint subnet -------------------------------------------
Write-Host "`nStep 3: Private endpoint subnet ($PE_SUBNET_PREFIX)..." -ForegroundColor Cyan
$existingPeSubnet = az network vnet subnet show --name $PE_SUBNET_NAME --vnet-name $VNET_NAME --resource-group $VNET_RESOURCE_GROUP 2>$null
if (-not $existingPeSubnet) {
    az network vnet subnet create `
        --name                    $PE_SUBNET_NAME `
        --resource-group          $VNET_RESOURCE_GROUP `
        --vnet-name               $VNET_NAME `
        --address-prefixes        $PE_SUBNET_PREFIX `
        --network-security-group  $peNsgName `
        --private-endpoint-network-policies Disabled
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create PE subnet."; exit 1 }
    Write-Host "PE subnet created." -ForegroundColor Green
} else {
    Write-Host "PE subnet already exists." -ForegroundColor Green
}

# -- Step 4: Web app integration subnet ----------------------------------------
Write-Host "`nStep 4: Web app integration subnet ($WEBAPP_SUBNET_PREFIX)..." -ForegroundColor Cyan
$existingWebSubnet = az network vnet subnet show --name $WEBAPP_SUBNET_NAME --vnet-name $VNET_NAME --resource-group $VNET_RESOURCE_GROUP 2>$null
if (-not $existingWebSubnet) {
    az network vnet subnet create `
        --name                    $WEBAPP_SUBNET_NAME `
        --resource-group          $VNET_RESOURCE_GROUP `
        --vnet-name               $VNET_NAME `
        --address-prefixes        $WEBAPP_SUBNET_PREFIX `
        --network-security-group  $webappNsgName `
        --delegations             Microsoft.Web/serverFarms
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create WebApp subnet."; exit 1 }
    Write-Host "WebApp subnet created." -ForegroundColor Green
} else {
    Write-Host "WebApp subnet already exists." -ForegroundColor Green
}

Write-Host "`n=== Networking Setup Complete ===" -ForegroundColor Green
Write-Host "PE subnet     : $PE_SUBNET_NAME ($PE_SUBNET_PREFIX)" -ForegroundColor White
Write-Host "WebApp subnet : $WEBAPP_SUBNET_NAME ($WEBAPP_SUBNET_PREFIX)" -ForegroundColor White
Write-Host "`nNext: run .\scripts\openai-deploy.ps1"
