# ACR Build and Push Script
# Builds the condition-extractor Docker image and pushes it to Azure Container Registry.
# Modelled on the RECAP acr-container-push.ps1 pattern.
#
# Usage:
#   .\scripts\acr-push.ps1                   # Uses deploy.env by default
#   .\scripts\acr-push.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - ACR Build and Push ===" -ForegroundColor Cyan

# -- Load env file --------------------------------------------------------------
if (-not (Test-Path $EnvFile)) {
    Write-Error "Environment file '$EnvFile' not found. Copy deploy.env.sample to deploy.env and fill in your values."
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
foreach ($required in @('DOCKER_REGISTRY', 'DOCKER_REPOSITORY')) {
    if (-not (Get-Variable -Name $required -ValueOnly -ErrorAction SilentlyContinue)) {
        Write-Error "$required is not set in $EnvFile"
        exit 1
    }
}

$Registry        = $DOCKER_REGISTRY
$Repository      = $DOCKER_REPOSITORY
$acrName         = if ($ACR_NAME) { $ACR_NAME } else { ($Registry -split '\.')[0] }
$acrSubscription = $ACR_SUBSCRIPTION

Write-Host "Registry  : $Registry" -ForegroundColor White
Write-Host "Repository: $Repository" -ForegroundColor White

# -- Check Azure login ----------------------------------------------------------
$azAccount = az account show 2>$null
if (-not $azAccount) {
    Write-Host "Not logged in to Azure - running az login..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) { Write-Error "Azure login failed."; exit 1 }
} else {
    Write-Host "Already logged in to Azure." -ForegroundColor Green
}

# -- Check Docker Desktop -------------------------------------------------------
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker Desktop is not running. Please start it and try again."
    exit 1
}
Write-Host "Docker Desktop is running." -ForegroundColor Green

# -- Auto-versioning (yyMMdd.N) -------------------------------------------------
$dateTag = Get-Date -Format "yyMMdd"
$increment = 1
$versionTag = "$dateTag.$increment"

do {
    $tagExists = $false
    docker manifest inspect "$Registry/$Repository`:$versionTag" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $tagExists = $true
        $increment++
        $versionTag = "$dateTag.$increment"
    }
} while ($tagExists)

$versionedImage = "$Registry/$Repository`:$versionTag"
$latestImage    = "$Registry/$Repository`:latest"

Write-Host "Version tag: $versionTag" -ForegroundColor Green

# -- ACR Login -----------------------------------------------------------------
Write-Host "`nLogging in to ACR: $Registry (name: $acrName)" -ForegroundColor Cyan
if ($acrSubscription) {
    az acr login --name $acrName --subscription $acrSubscription
} else {
    az acr login --name $acrName
}
if ($LASTEXITCODE -ne 0) { Write-Error "ACR login failed."; exit 1 }

# -- Build ----------------------------------------------------------------------
Write-Host "`nBuilding image: $versionedImage" -ForegroundColor Cyan
docker build -t $versionedImage .
if ($LASTEXITCODE -ne 0) { Write-Error "Docker build failed."; exit 1 }

docker tag $versionedImage $latestImage
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to tag as latest."; exit 1 }

# -- Push -----------------------------------------------------------------------
Write-Host "`nPushing $versionedImage..." -ForegroundColor Cyan
docker push $versionedImage
if ($LASTEXITCODE -ne 0) { Write-Error "Push failed."; exit 1 }

Write-Host "Pushing $latestImage..." -ForegroundColor Cyan
docker push $latestImage
if ($LASTEXITCODE -ne 0) { Write-Error "Push of latest failed."; exit 1 }

Write-Host "`n=== ACR Push Complete ===" -ForegroundColor Green
Write-Host "  $versionedImage" -ForegroundColor White
Write-Host "  $latestImage" -ForegroundColor White
