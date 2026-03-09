# Private Endpoint and DNS Setup for Azure OpenAI
# Creates a private endpoint so the App Service can reach OpenAI via the VNet.
# Also creates the private DNS zone so the hostname resolves to the private IP.
# Safe to re-run - skips resources that already exist.
#
# Must run AFTER: openai-deploy.ps1 and networking-setup.ps1
#
# Usage:
#   .\scripts\private-endpoint-deploy.ps1                   # Uses deploy.env
#   .\scripts\private-endpoint-deploy.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - Private Endpoint Setup ===" -ForegroundColor Cyan

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
foreach ($required in @('AZURE_RESOURCE_GROUP', 'OPENAI_NAME', 'VNET_RESOURCE_GROUP', 'VNET_NAME', 'PE_SUBNET_NAME')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

# OPENAI_RESOURCE_GROUP defaults to AZURE_RESOURCE_GROUP if not set separately
if (-not $OPENAI_RESOURCE_GROUP) { $OPENAI_RESOURCE_GROUP = $AZURE_RESOURCE_GROUP }

# Private endpoint must be in the same region as the VNet
$vnetLocation = az network vnet show --name $VNET_NAME --resource-group $VNET_RESOURCE_GROUP --query "location" --output tsv

$peName    = "$OPENAI_NAME-pe"
$dnsZone   = "privatelink.openai.azure.com"
$dnsLink   = "$OPENAI_NAME-dns-link"
$dnsGroup  = "openai-dns-group"

Write-Host "OpenAI         : $OPENAI_NAME (in $OPENAI_RESOURCE_GROUP)" -ForegroundColor White
Write-Host "Private Endpoint: $peName" -ForegroundColor White
Write-Host "VNet           : $VNET_NAME (in $VNET_RESOURCE_GROUP)" -ForegroundColor White
Write-Host "PE Subnet      : $PE_SUBNET_NAME" -ForegroundColor White

# -- Step 1: Get OpenAI resource ID --------------------------------------------
Write-Host "`nStep 1: Verifying OpenAI service exists..." -ForegroundColor Cyan
$subscriptionId = az account show --query "id" --output tsv
$openAIResourceId = "/subscriptions/$subscriptionId/resourceGroups/$OPENAI_RESOURCE_GROUP/providers/Microsoft.CognitiveServices/accounts/$OPENAI_NAME"

$oaiCheck = az cognitiveservices account show --name $OPENAI_NAME --resource-group $OPENAI_RESOURCE_GROUP 2>$null
if (-not $oaiCheck) {
    Write-Error "Azure OpenAI '$OPENAI_NAME' not found. Run openai-deploy.ps1 first."
    exit 1
}
Write-Host "Azure OpenAI verified." -ForegroundColor Green

# -- Step 2: Create private endpoint -------------------------------------------
Write-Host "`nStep 2: Creating private endpoint..." -ForegroundColor Cyan
$existingPe = az network private-endpoint show --name $peName --resource-group $AZURE_RESOURCE_GROUP 2>$null
if ($existingPe) {
    Write-Host "Private endpoint already exists." -ForegroundColor Green
} else {
    Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
    $subnetId = az network vnet subnet show `
        --name           $PE_SUBNET_NAME `
        --vnet-name      $VNET_NAME `
        --resource-group $VNET_RESOURCE_GROUP `
        --query          "id" --output tsv
    az network private-endpoint create `
        --name                           $peName `
        --resource-group                 $AZURE_RESOURCE_GROUP `
        --subnet                         $subnetId `
        --private-connection-resource-id $openAIResourceId `
        --group-id                       "account" `
        --connection-name                "openai-connection" `
        --location                       $vnetLocation

    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create private endpoint."; exit 1 }
    Write-Host "Private endpoint created." -ForegroundColor Green
}

# -- Steps 3-5: DNS zone (managed centrally by BCGov) --------------------------
# BCGov policy blocks creating private DNS zones in spoke subscriptions.
# DNS zones live in the connectivity subscription and auto-register via policy
# when a private endpoint is created. No action needed here.
Write-Host "`nSteps 3-5: DNS zone management skipped." -ForegroundColor Yellow
Write-Host "BCGov manages privatelink DNS centrally in the connectivity subscription." -ForegroundColor Yellow
Write-Host "The private endpoint DNS record is auto-registered via Azure Policy." -ForegroundColor Yellow

# -- Summary --------------------------------------------------------------------
Write-Host "`n=== Private Endpoint Setup Complete ===" -ForegroundColor Green
Write-Host "Private endpoint : $peName" -ForegroundColor White
Write-Host "DNS zone         : managed centrally by BCGov connectivity subscription" -ForegroundColor White
Write-Host "DNS resolution   : $OPENAI_NAME.openai.azure.com -> private IP (via hub DNS)" -ForegroundColor White
Write-Host "`nNext: run .\scripts\deploy.ps1 -SkipInfra to build and deploy the App Service"
