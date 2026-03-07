# Azure OpenAI Service Deployment
# Uses an ARM template to set publicNetworkAccess=Disabled at creation time,
# satisfying the BC Gov Deny-PublicPaaSEndpoints policy.
# Safe to re-run - skips model deployments that already exist.
#
# Usage:
#   .\scripts\openai-deploy.ps1                   # Uses deploy.env
#   .\scripts\openai-deploy.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - Azure OpenAI Deployment ===" -ForegroundColor Cyan

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
foreach ($required in @('AZURE_RESOURCE_GROUP', 'OPENAI_NAME', 'AZURE_LOCATION', 'AZURE_OPENAI_DEPLOYMENT')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

Write-Host "Resource Group  : $AZURE_RESOURCE_GROUP" -ForegroundColor White
Write-Host "OpenAI Name     : $OPENAI_NAME" -ForegroundColor White
Write-Host "Location        : $AZURE_LOCATION" -ForegroundColor White
Write-Host "Model Deployment: $AZURE_OPENAI_DEPLOYMENT" -ForegroundColor White

# -- Step 1: Create OpenAI service via ARM template ----------------------------
# ARM template is required - direct CLI creation is blocked by BC Gov policy
# because it defaults to publicNetworkAccess=Enabled.
Write-Host "`nStep 1: Creating Azure OpenAI service (ARM template)..." -ForegroundColor Cyan

$existingOai = az cognitiveservices account show --name $OPENAI_NAME --resource-group $AZURE_RESOURCE_GROUP 2>$null
if ($existingOai) {
    Write-Host "Azure OpenAI service already exists." -ForegroundColor Green
} else {
    $armTemplate = @"
{
  "`$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.CognitiveServices/accounts",
      "apiVersion": "2023-05-01",
      "name": "$OPENAI_NAME",
      "location": "$AZURE_LOCATION",
      "sku": { "name": "S0" },
      "kind": "OpenAI",
      "properties": {
        "customSubDomainName": "$OPENAI_NAME",
        "publicNetworkAccess": "Disabled",
        "networkAcls": {
          "defaultAction": "Deny",
          "ipRules": [],
          "virtualNetworkRules": []
        }
      }
    }
  ]
}
"@

    $armTemplate | Out-File -FilePath "openai-arm-template.json" -Encoding UTF8

    az deployment group create `
        --resource-group $AZURE_RESOURCE_GROUP `
        --template-file  "openai-arm-template.json"

    Remove-Item "openai-arm-template.json" -Force

    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to deploy Azure OpenAI service."; exit 1 }
    Write-Host "Azure OpenAI service created." -ForegroundColor Green
}

# -- Step 2: Deploy model -------------------------------------------------------
Write-Host "`nStep 2: Deploying model '$AZURE_OPENAI_DEPLOYMENT'..." -ForegroundColor Cyan

$existingDeployment = az cognitiveservices account deployment show `
    --name $OPENAI_NAME `
    --resource-group $AZURE_RESOURCE_GROUP `
    --deployment-name $AZURE_OPENAI_DEPLOYMENT 2>$null

if ($existingDeployment) {
    Write-Host "Model deployment '$AZURE_OPENAI_DEPLOYMENT' already exists." -ForegroundColor Green
} else {
    # Determine SKU based on model name
    # gpt-4o-mini requires GlobalStandard; gpt-4o uses Standard
    $modelSku = "Standard"
    if ($AZURE_OPENAI_DEPLOYMENT -like "*mini*") {
        $modelVersion = "2024-07-18"
    } else {
        $modelVersion = "2024-11-20"
    }

    az cognitiveservices account deployment create `
        --name            $OPENAI_NAME `
        --resource-group  $AZURE_RESOURCE_GROUP `
        --deployment-name $AZURE_OPENAI_DEPLOYMENT `
        --model-name      $AZURE_OPENAI_DEPLOYMENT `
        --model-version   $modelVersion `
        --model-format    OpenAI `
        --sku-capacity    10 `
        --sku-name        $modelSku

    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create model deployment."; exit 1 }
    Write-Host "Model deployment created (SKU: $modelSku)." -ForegroundColor Green
}

# -- Step 3: Get endpoint and key -----------------------------------------------
Write-Host "`nStep 3: Retrieving endpoint and API key..." -ForegroundColor Cyan

$endpoint = az cognitiveservices account show `
    --name $OPENAI_NAME `
    --resource-group $AZURE_RESOURCE_GROUP `
    --query "properties.endpoint" --output tsv

$apiKey = az cognitiveservices account keys list `
    --name $OPENAI_NAME `
    --resource-group $AZURE_RESOURCE_GROUP `
    --query "key1" --output tsv

Write-Host "`n=== Azure OpenAI Deployment Complete ===" -ForegroundColor Green
Write-Host "Endpoint  : $endpoint" -ForegroundColor White
Write-Host "Deployment: $AZURE_OPENAI_DEPLOYMENT" -ForegroundColor White
Write-Host "API Key   : $apiKey" -ForegroundColor White

Write-Host "`nACTION REQUIRED: Update your deploy.env with these values:" -ForegroundColor Yellow
Write-Host "  AZURE_OPENAI_ENDPOINT=$endpoint" -ForegroundColor Yellow
Write-Host "  AZURE_OPENAI_API_KEY=$apiKey" -ForegroundColor Yellow

Write-Host "`nNext: run .\scripts\private-endpoint-deploy.ps1"
