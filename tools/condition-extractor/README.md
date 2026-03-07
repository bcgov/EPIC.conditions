# condition-extractor

Azure App Service (containerised Flask API) that uses Azure OpenAI to extract structured
conditions from PDF text.

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/v1/chat/completions` | X-API-Key or Bearer | OpenAI-compatible proxy to Azure OpenAI |

All endpoints except `/health` require either `X-API-Key: <API_KEY>` or `Authorization: Bearer <API_KEY>`.

---

## Folder Structure

```
condition-extractor/
├── app.py                    # Flask entry point — proxy + auth middleware
├── Dockerfile
├── requirements.txt
├── deploy.env.sample         # Copy to deploy.env and fill in values (gitignored)
├── .env.sample               # Copy to .env for local development (gitignored)
├── scripts/
│   ├── deploy.ps1            # Master orchestration — runs all steps in sequence
│   ├── networking-setup.ps1  # Create VNet subnets and NSGs (one-time infra)
│   ├── openai-deploy.ps1     # Create Azure OpenAI service (one-time infra)
│   ├── private-endpoint-deploy.ps1  # Create private endpoint + DNS (one-time infra)
│   ├── acr-push.ps1          # Build Docker image and push to ACR
│   ├── webapp-deploy.ps1     # Create / configure Azure App Service (one-time)
│   ├── configure-settings.ps1  # Apply environment variables to App Service
│   └── test-api.ps1          # Smoke test: health, auth, proxy
└── src/
    └── config/settings.py    # Pydantic settings loaded from environment
```

---

## Prerequisites

- **Azure CLI** (`az`) installed and in PATH
- **Docker Desktop** running
- **PowerShell** 5.1+ (scripts use `.ps1`)
- Access to the **BC Gov `tools` Azure subscription** (for the ACR)
- Access to the **target Azure subscription** (test / prod) where the App Service lives
- The VNet (`c4b0a8-<env>-vwan-spoke`) must already exist in the landing zone networking RG

---

## Local Development

```powershell
cd tools/condition-extractor

# 1. Copy and fill in local env
cp .env.sample .env
# Edit .env: set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run locally (no auth required by default — API_KEY is blank in .env.sample)
flask --app app run --port 8000

# 4. Test
curl http://localhost:8000/health
```

---

## Azure Deployment

### First-Time Setup

> Run this once per environment (test / prod). All scripts are idempotent — safe to re-run.

**1. Fill in the deployment config**

```powershell
cd tools/condition-extractor
cp deploy.env.sample deploy.env
# Edit deploy.env with values for your target environment
```

Key things to set in `deploy.env`:
- `AZURE_RESOURCE_GROUP` — resource group for the App Service (will be created if needed)
- `VNET_RESOURCE_GROUP`, `VNET_NAME` — the landing zone VNet (check with `az network vnet list`)
- `PE_SUBNET_PREFIX`, `WEBAPP_SUBNET_PREFIX` — two unused /28 or /27 CIDR blocks in the VNet
- `OPENAI_NAME`, `OPENAI_RESOURCE_GROUP` — existing Azure OpenAI service, or leave `OPENAI_NAME` as a new name for `openai-deploy.ps1` to create
- `DOCKER_REGISTRY`, `ACR_NAME`, `ACR_SUBSCRIPTION` — the `tools` subscription ACR
- `DOCKER_REGISTRY_SERVER_USERNAME/PASSWORD` — required because the ACR is in a **different subscription** from the App Service (cross-subscription managed identity is not supported by Azure App Service for ACR pull)
- `API_KEY` — a strong random string; set this same value in `condition-parser/.env` as `EXTRACTOR_API_KEY`

**2. Log in to Azure (test/prod subscription)**

```powershell
az login
az account set --subscription "<your-target-subscription>"
```

**3. Run the full deployment**

```powershell
.\scripts\deploy.ps1
```

This runs 7 steps in sequence:

| Step | Script | What it does |
|------|--------|-------------|
| 1 | `networking-setup.ps1` | Creates NSGs and two subnets (PE + WebApp) in the landing zone VNet |
| 2 | `openai-deploy.ps1` | Creates Azure OpenAI service and prints endpoint + API key |
| 3 | `private-endpoint-deploy.ps1` | Creates private endpoint + private DNS zone so the App Service can reach OpenAI privately |
| — | **Pause** | Script pauses here — copy the endpoint and API key from Step 2 into `deploy.env`, then press Enter |
| 4 | `acr-push.ps1` | Builds Docker image, tags it, pushes to ACR |
| 5 | `webapp-deploy.ps1` | Creates App Service Plan + App Service, enables Managed Identity, grants AcrPull, configures VNet integration |
| 6 | `configure-settings.ps1` | Sets all environment variables as App Service Application Settings |
| 7 | `test-api.ps1` | Smoke tests: `/health`, auth guard, `/classify` |

A timestamped log file (`deploy-<timestamp>.log`) is written to the working directory.

> **Note — existing OpenAI service:** If reusing an existing Azure OpenAI service (e.g. `ai-epic-poc-east` in `rg-epic-search`), set `OPENAI_RESOURCE_GROUP` to its resource group and `OPENAI_NAME` to its name. Step 2 will detect it already exists and skip creation but still print the endpoint and key.

---

### Redeploying After a Code Change

When only the application code has changed (no infrastructure changes needed):

```powershell
cd tools/condition-extractor
.\scripts\deploy.ps1 -SkipInfra -SkipWebApp
```

This runs only Steps 4 → 6 → 7:
- Builds and pushes a new Docker image (auto-versioned `yyMMdd.N` tag + `latest`)
- Re-applies Application Settings
- Runs smoke tests

Then **restart the App Service** in the Azure portal (or `az webapp restart`) to pull the new image.

---

### Run Individual Steps

```powershell
# Build and push image only
.\scripts\acr-push.ps1

# Re-apply environment variables only (e.g. after rotating API_KEY)
.\scripts\configure-settings.ps1

# Re-create or reconfigure App Service only
.\scripts\webapp-deploy.ps1

# Run smoke tests only
.\scripts\test-api.ps1
```

---

## Azure Resources

| Resource | Type | Notes |
|----------|------|-------|
| `rg-condition-extractor-<env>` | Resource Group | Created by deployment scripts |
| `asp-condition-extractor` | App Service Plan | Linux, B1 SKU |
| `condition-extractor-api` | App Service | Container, system-assigned Managed Identity |
| `xxxxxx-<env>-cond-ext-pe-subnet` | VNet Subnet /28 | Private endpoint subnet |
| `xxxxxx-<env>-cond-ext-webapp-subnet` | VNet Subnet /28 | App Service VNet integration subnet |
| `xxxxxx-xxxxxx.azurecr.io` | Container Registry | Pre-existing in `tools` subscription |
| Azure OpenAI service | Cognitive Services | Pre-existing or created by `openai-deploy.ps1` |

> **Cross-subscription ACR:** The ACR lives in the `tools` subscription; the App Service lives in `test`/`prod`. Azure App Service managed identity cannot pull images across subscriptions, so ACR admin credentials must be set in `deploy.env` (`DOCKER_REGISTRY_SERVER_USERNAME/PASSWORD`).

---

## Architecture

```
condition-parser (Gradio / local)
condition-processor (OpenShift CronJob)
    │
    │  POST /v1/chat/completions  (OpenAI-compatible)
    │  X-API-Key: <API_KEY>
    ▼
Azure App Service — condition-extractor-api
    │  (VNet integration → WebApp subnet)
    │  HTTP proxy (strips model field, injects Azure credentials)
    ▼
Private Endpoint (PE subnet, private DNS)
    ▼
Azure OpenAI Service
```

All outbound traffic from the App Service is routed through the VNet (`vnetRouteAllEnabled: true`),
so Azure OpenAI is reached via the private endpoint without leaving the Microsoft network.

---

## Environment Variables Reference

### Application settings (set on App Service by `configure-settings.ps1`, sourced from `deploy.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Model deployment name (e.g. `gpt-4o-mini`) |
| `AZURE_OPENAI_API_VERSION` | No | API version for Azure OpenAI. Defaults to `2024-10-21` |
| `API_KEY` | Yes (prod) | X-API-Key secret; blank = open access (dev only) |
| `PORT` | No | Defaults to `8000` |

### Deployment-only variables (used by scripts, not set on App Service)

| Variable | Description |
|----------|-------------|
| `AZURE_RESOURCE_GROUP` | Resource group for the App Service |
| `AZURE_APP_SERVICE_PLAN` | App Service Plan name |
| `AZURE_APP_NAME` | App Service name |
| `AZURE_LOCATION` | Azure region (e.g. `canadaeast`) |
| `VNET_RESOURCE_GROUP` | Resource group of the landing zone VNet |
| `VNET_NAME` | Landing zone VNet name |
| `PE_SUBNET_NAME` / `PE_SUBNET_PREFIX` | Private endpoint subnet name and CIDR |
| `WEBAPP_SUBNET_NAME` / `WEBAPP_SUBNET_PREFIX` | App Service VNet integration subnet and CIDR |
| `OPENAI_NAME` | Azure OpenAI service name |
| `OPENAI_RESOURCE_GROUP` | Resource group of the Azure OpenAI service |
| `DOCKER_REGISTRY` | ACR hostname (e.g. `xxxxxx-xxx.azurecr.io`) |
| `DOCKER_REPOSITORY` | Image repository path (e.g. `ai/condition-extractor`) |
| `ACR_NAME` | ACR resource name (e.g. `xxxxxx`) |
| `ACR_SUBSCRIPTION` | Subscription containing the ACR (the `tools` subscription) |
| `DOCKER_REGISTRY_SERVER_USERNAME` | ACR admin username — required for cross-subscription pull |
| `DOCKER_REGISTRY_SERVER_PASSWORD` | ACR admin password — required for cross-subscription pull |
