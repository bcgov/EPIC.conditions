# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Service for generating documents via the DocGen service."""

import time

import requests
from flask import current_app, g, json

TEMPLATE_KEY = "CONSOLIDATED_CONDITIONS_TEMPLATE"
APP_NAME = "CONDITION"

_MAX_RETRIES = 3
_RETRY_WAIT = 2  # seconds


class DocGenService:
    """Service for generating PDF/HTML documents via the external DocGen service."""

    @staticmethod
    def render_template(template_key: str, context: dict, output_type: str = "html"):
        """Render a registered template with the given context data."""
        return _request_docgen_service(
            "templates/render?use_total_pages=true",
            {
                "template_key": template_key,
                "app": APP_NAME,
                "data": context,
                "output_type": output_type,
            },
        )


def _request_docgen_service(relative_url: str, data: dict = None):
    """Make a POST request to the DocGen service with simple retry logic."""
    token = getattr(g, "access_token", None)
    docgen_service_url = current_app.config.get("DOCGEN_SERVICE_URL", "")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    url = f"{docgen_service_url}/api/{relative_url}"

    last_exc = None
    for attempt in range(_MAX_RETRIES):
        try:
            response = requests.post(
                url=url, headers=headers, data=json.dumps(data), timeout=60
            )
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_RETRY_WAIT)

    raise last_exc
