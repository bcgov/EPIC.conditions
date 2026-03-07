# End-to-End API Test Script
# Tests the deployed condition-extractor API: health check + classify endpoint.
# Modelled on the RECAP proxy-llm-basic-test.ps1 pattern.
#
# Usage:
#   .\scripts\test-api.ps1                   # Uses deploy.env
#   .\scripts\test-api.ps1 -EnvFile my.env

param(
    [string]$EnvFile = "deploy.env"
)

Write-Host "=== Condition Extractor - API Test ===" -ForegroundColor Cyan

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

$appName       = $AZURE_APP_NAME
$resourceGroup = $AZURE_RESOURCE_GROUP
$apiKey        = $API_KEY

$appUrl = az webapp show `
    --resource-group $resourceGroup `
    --name          $appName `
    --query         defaultHostName `
    --output        tsv

$baseUrl = "https://$appUrl"
$headers = @{ "X-API-Key" = $apiKey; "Content-Type" = "application/json" }

$passed = 0
$failed = 0

function Test-Endpoint {
    param([string]$Name, [string]$Url, [string]$Method = "GET", [hashtable]$Headers = @{}, [string]$Body = $null)

    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    Write-Host "  $Method $Url" -ForegroundColor Gray
    try {
        $params = @{ Uri = $Url; Method = $Method; Headers = $Headers; TimeoutSec = 30 }
        if ($Body) { $params.Body = $Body }
        $response = Invoke-RestMethod @params
        Write-Host "  PASS - Response: $($response | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  FAIL - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# -- Test 1: Health (no auth required) -----------------------------------------
if (Test-Endpoint -Name "Health check" -Url "$baseUrl/health") { $passed++ } else { $failed++ }

# -- Test 2: Auth guard (should reject request without key) --------------------
Write-Host "`nTesting: Auth guard (no key - expect 401)" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions" -Method POST -ContentType "application/json" -Body '{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}]}' -TimeoutSec 10 | Out-Null
    Write-Host "  FAIL - Should have returned 401 but did not" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "  PASS - Correctly returned 401 Unauthorized" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL - Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# -- Test 3: Chat completions proxy --------------------------------------------
$chatBody = @{
    model    = "gpt-4o"
    messages = @(@{ role = "user"; content = "Reply with just the word: ok" })
} | ConvertTo-Json -Depth 3
if (Test-Endpoint -Name "POST /v1/chat/completions" -Url "$baseUrl/v1/chat/completions" -Method POST -Headers $headers -Body $chatBody) { $passed++ } else { $failed++ }

# -- Summary --------------------------------------------------------------------
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -gt 0) { exit 1 } else { exit 0 }
