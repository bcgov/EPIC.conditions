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
"""API endpoints for managing a consolidated condition resource."""

import base64
import re
from datetime import datetime
from http import HTTPStatus
from io import BytesIO

import requests as http_requests
from flask import current_app, request, send_file
from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from marshmallow import ValidationError

from condition_api.services import authorization
from condition_api.services.condition_service import ConditionService
from condition_api.services.docgen_service import TEMPLATE_KEY, DocGenService
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("conditions", description="Endpoints for Consolidated Condition Management")


def _fetch_logo_as_data_url(logo_url: str) -> str:
    """Fetch the logo and return it as a base64 data URI so it is embedded in the PDF."""
    if not logo_url:
        return ""
    try:
        response = http_requests.get(logo_url, timeout=10)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "image/png").split(";")[0]
        b64 = base64.b64encode(response.content).decode("utf-8")
        return f"data:{content_type};base64,{b64}"
    except Exception:  # pylint: disable=broad-except
        return logo_url  # fall back to URL if fetch fails


def _build_render_context(consolidated: dict) -> dict:
    """Build the template context dict from consolidated conditions data."""
    conditions = consolidated.get("conditions", [])
    project_name = consolidated.get("project_name", "")

    amendment_set = set()
    for cond in conditions:
        for part in (cond.get("amendment_names") or "").split(","):
            trimmed = part.strip()
            if trimmed:
                amendment_set.add(trimmed)

    approved_count = sum(1 for c in conditions if c.get("is_approved"))
    now = datetime.now()

    return {
        "project_name": project_name,
        "generated_on": now.strftime("%A, %B ") + str(now.day) + now.strftime(", %Y"),
        "generated_on_short": now.strftime("%B ") + str(now.day) + now.strftime(", %Y"),
        "total_conditions": len(conditions),
        "amendment_list": ", ".join(sorted(amendment_set)),
        "all_approved": all(cond.get("is_approved") for cond in conditions),
        "approved_count": approved_count,
        "awaiting_count": len(conditions) - approved_count,
        "logo_url": _fetch_logo_as_data_url(current_app.config.get("EAO_LOGO_URL", "")),
        "conditions": conditions,
    }


def _safe_filename(project_name: str) -> str:
    """Return a filesystem-safe version of the project name."""
    name = re.sub(r"[^a-z0-9]", "_", project_name.lower())
    return re.sub(r"_+", "_", name).strip("_")


@cors_preflight("GET, OPTIONS")
@API.route("/project/<string:project_id>", methods=["GET", "OPTIONS"])
class ConditionResource(Resource):
    """Resource for fetching consolidated conditions by project_id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get consolidated conditions by project id")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.optional
    @cross_origin(origins=allowedorigins())
    def get(project_id):
        """Fetch consolidated conditions and condition attributes by project ID."""
        try:
            user_is_internal = authorization.check_auth()

            query_params = request.args
            include_condition_attributes = (
                True if user_is_internal
                else query_params.get('include_attributes', '').lower() == 'true'
            )
            all_conditions = query_params.get('all_conditions', '').lower() == 'true'
            category_id = query_params.get('category_id', '')

            consolidated_conditions = ConditionService.get_consolidated_conditions(
                project_id,
                category_id,
                all_conditions,
                include_condition_attributes,
                user_is_internal
            )

            if not consolidated_conditions:
                return {"message": "Condition not found"}, HTTPStatus.NOT_FOUND

            return consolidated_conditions, HTTPStatus.OK

        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("POST, OPTIONS")
@API.route("/project/<string:project_id>/render", methods=["POST", "OPTIONS"])
class ConsolidatedConditionRenderResource(Resource):
    """Resource for rendering consolidated conditions as a PDF via the DocGen service."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Render consolidated conditions as PDF")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @API.response(HTTPStatus.NOT_FOUND, "No conditions found")
    @auth.optional
    @cross_origin(origins=allowedorigins())
    def post(project_id):
        """Generate a PDF of consolidated conditions for a project."""
        try:
            output_format = "pdf"
            if request.is_json:
                output_format = request.json.get("output_format", "pdf")

            consolidated = ConditionService.get_consolidated_conditions(
                project_id,
                all_conditions=True,
                include_condition_attributes=False,
                user_is_internal=True,
            )

            if not consolidated:
                return {"message": "No conditions found for this project"}, HTTPStatus.NOT_FOUND

            context = _build_render_context(consolidated)
            docgen_response = DocGenService.render_template(TEMPLATE_KEY, context, output_format)

            if output_format == "pdf":
                safe_name = _safe_filename(consolidated.get("project_name", ""))
                return send_file(
                    BytesIO(docgen_response.content),
                    mimetype="application/pdf",
                    as_attachment=True,
                    download_name=f"Consolidated_Conditions_{safe_name}.pdf",
                )

            return docgen_response.json(), HTTPStatus.OK

        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
        except Exception as err:  # pylint: disable=broad-except
            return {"message": f"Failed to generate PDF: {str(err)}"}, HTTPStatus.INTERNAL_SERVER_ERROR
