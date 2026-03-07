# Architecture — condition-extractor

## Purpose

`condition-extractor` is a thin, stateless HTTP proxy deployed as an Azure App Service container.
It sits between the condition-parser (local Gradio app) and Azure OpenAI, providing:

- **Centralised auth** — callers use a shared `API_KEY`; the Azure OpenAI key never leaves Azure
- **Private network path** — all traffic stays inside the Microsoft network via VNet + private endpoint
- **Model indirection** — the model/deployment name is configured server-side; clients send any `model` value and it is silently substituted

---

## Request Flow

```
condition-parser (local)
    │
    │  POST /v1/chat/completions
    │  Authorization: Bearer <API_KEY>   (OpenAI SDK format)
    │  body: { model, messages, tools, … }
    ▼
Azure App Service — condition-extractor-api
    │
    │  Auth check (X-API-Key or Bearer token)
    │  Strip `model` field from body
    │  Inject Azure credentials + deployment URL
    │
    │  POST https://<openai-endpoint>/openai/deployments/<deployment>/chat/completions
    │        ?api-version=<AZURE_OPENAI_API_VERSION>
    │  api-key: <AZURE_OPENAI_API_KEY>
    │  body: { messages, tools, … }   (model field removed)
    ▼
Private Endpoint → Azure OpenAI Service
    │
    │  Response forwarded as-is
    ▼
condition-parser
```

---

## Components

### `app.py`

Single-file Flask application. No blueprints or service layers — the proxy logic fits in one route.

| Section | Responsibility |
|---------|---------------|
| `require_api_key()` | Before-request hook; accepts `X-API-Key` or `Authorization: Bearer` |
| `GET /health` | Returns `{"status": "ok"}` — used by App Service health checks and `test-api.ps1` |
| `POST /v1/chat/completions` | Proxies to Azure OpenAI (primary) or OpenAI (fallback if `OPENAI_API_KEY` is set) |
| `handle_error()` | Global exception handler; logs and returns 500 |

### Backend selection logic

```
OPENAI_API_KEY set?
    yes → forward to api.openai.com (dev/fallback mode)
    no  →
        AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT set?
            yes → forward to Azure OpenAI deployment
            no  → return 503
```

### `src/config/settings.py`

| Variable | Default | Notes |
|----------|---------|-------|
| `AZURE_OPENAI_ENDPOINT` | — | e.g. `https://my-service.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | — | Azure OpenAI key (never sent to callers) |
| `AZURE_OPENAI_DEPLOYMENT` | — | Deployment name, e.g. `gpt-4o` |
| `AZURE_OPENAI_API_VERSION` | `2024-10-21` | Azure OpenAI REST API version |
| `OPENAI_API_KEY` | — | If set, routes to `api.openai.com` instead |
| `API_KEY` | — | Shared secret for callers; blank = open (dev only) |
| `PORT` | `8000` | HTTP listen port |

---

## Networking

The App Service is deployed with **VNet integration** (`vnetRouteAllEnabled: true`), so all
outbound traffic — including the Azure OpenAI call — flows through the landing zone VNet.

```
App Service
  └─ VNet integration
       └─ Private Endpoint
            └─ Azure OpenAI Service (private DNS)
```

---

## Container and Registry

The app is packaged as a Docker image and hosted in ACR (`tools` subscription).
The App Service pulls the image using ACR admin credentials because the ACR and App Service
are in **different Azure subscriptions** — cross-subscription managed identity pull is not
supported by Azure App Service.

Image tag format: `yyMMdd.N` (e.g. `250306.1`) plus a `latest` alias, applied by `acr-push.ps1`.

---

## Deployment Scripts

| Script | When to run |
|--------|-------------|
| `deploy.ps1` | First-time full deployment (orchestrates all steps) |
| `acr-push.ps1` | After any code change — builds and pushes a new image |
| `configure-settings.ps1` | After any `deploy.env` change — updates App Service settings and restarts |
| `webapp-deploy.ps1` | After infra changes to the App Service itself |
| `test-api.ps1` | Smoke test after any deployment |

For a code-only change (no infra changes):
```powershell
.\scripts\deploy.ps1 -SkipInfra -SkipWebApp
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Pure proxy, no extraction logic | The extractor just provides secure model access. Keeps the deployed service simple and rarely needing redeployment. |
| `model` field stripped from body | Azure OpenAI ignores the `model` field and routes by deployment name; stripping it avoids confusion and lets the server control which model is used. |
| Bearer token accepted alongside X-API-Key | The OpenAI Python SDK sends `Authorization: Bearer <api_key>` by default. Accepting both means callers need no custom headers. |
| Single `.py` file, no blueprints | The service has exactly two routes. Splitting into blueprints would add indirection with no benefit. |
