"""
EPIC Condition Extractor

Thin Azure-hosted proxy that forwards OpenAI-compatible chat completion
requests to the configured AI backend (OpenAI or Azure OpenAI).

All prompts, schemas, and retry logic live in condition-parser — this
service only provides authenticated API access to the model.

Endpoints
---------
GET  /health
POST /v1/chat/completions
"""

import sys
import os
import logging
from http import HTTPStatus

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from dotenv import load_dotenv
import requests as _requests

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

from src.config import get_settings


def create_app() -> Flask:
    app = Flask(__name__)
    settings = get_settings()

    @app.before_request
    def require_api_key():
        if request.path == "/health":
            return
        if not settings.api_key:
            return  # open access in dev mode
        # Accept X-API-Key header OR Authorization: Bearer <key> (OpenAI SDK)
        x_api_key = request.headers.get("X-API-Key", "")
        auth_header = request.headers.get("Authorization", "")
        bearer_key = auth_header[7:] if auth_header.startswith("Bearer ") else ""
        if x_api_key != settings.api_key and bearer_key != settings.api_key:
            return jsonify({"error": "Unauthorized"}), HTTPStatus.UNAUTHORIZED

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), HTTPStatus.OK

    @app.post("/v1/chat/completions")
    def proxy_chat_completions():
        body = request.get_json(force=True, silent=True) or {}

        if settings.openai_api_key:
            upstream = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            }
            resp = _requests.post(upstream, json=body, headers=headers, timeout=120)
        elif settings.azure_openai_api_key and settings.azure_openai_endpoint:
            deployment = settings.azure_openai_deployment or body.get("model", "gpt-4o")
            upstream = (
                f"{settings.azure_openai_endpoint.rstrip('/')}"
                f"/openai/deployments/{deployment}/chat/completions"
                f"?api-version={settings.azure_openai_api_version}"
            )
            headers = {
                "api-key": settings.azure_openai_api_key,
                "Content-Type": "application/json",
            }
            azure_body = {k: v for k, v in body.items() if k != "model"}
            resp = _requests.post(upstream, json=azure_body, headers=headers, timeout=120)
        else:
            return jsonify({"error": "No AI backend configured (set OPENAI_API_KEY or AZURE_OPENAI_*)"}), HTTPStatus.SERVICE_UNAVAILABLE

        try:
            return jsonify(resp.json()), resp.status_code
        except Exception:
            return resp.text, resp.status_code

    @app.errorhandler(Exception)
    def handle_error(err):
        logger.exception("Unhandled exception: %s", err)
        return jsonify({"error": "Internal server error"}), HTTPStatus.INTERNAL_SERVER_ERROR

    return app


app = create_app()

if __name__ == "__main__":
    port = get_settings().port
    app.run(host="0.0.0.0", port=port, debug=False)
