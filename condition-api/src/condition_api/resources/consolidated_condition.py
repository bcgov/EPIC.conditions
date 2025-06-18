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

from http import HTTPStatus

from flask import request

from flask_restx import Namespace, Resource, cors

from marshmallow import ValidationError

from condition_api.services import authorization
from condition_api.services.condition_service import ConditionService
from condition_api.utils.util import cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("conditions", description="Endpoints for Consolidated Condition Management")
"""Custom exception messages
"""


@cors_preflight("GET, OPTIONS")
@API.route("/project/<string:project_id>", methods=["GET", "OPTIONS"])
class ConditionResource(Resource):
    """Resource for fetching consolidated conditions by project_id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get consolidated conditions by project id")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.optional
    @cors.crossdomain(origin="*")
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
