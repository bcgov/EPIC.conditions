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
"""API endpoints for managing a condition resource."""

from http import HTTPStatus
from flask_restx import Namespace, Resource, cors
from marshmallow import ValidationError

from condition_api.schemas.condition import ConditionSchema, ProjectDocumentConditionDetailSchema, ProjectDocumentConditionSchema
from condition_api.services.condition_service import ConditionService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("conditions", description="Endpoints for Condition Management")
"""Custom exception messages
"""

condition_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ConditionSchema(), "Condition"
)

@cors_preflight("GET, OPTIONS, PATCH")
@API.route("/project/<string:project_id>/document/<string:document_id>/condition/<int:condition_number>", methods=["PATCH", "GET", "OPTIONS"])
class ConditionDetailsResource(Resource):
    """Resource for fetching condition details by project_id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get conditions by condition id")
    @API.response(code=HTTPStatus.CREATED, model=condition_model, description="Get conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(project_id, document_id, condition_number):
        """Fetch conditions and condition attributes by project ID."""
        try:
            condition_details = ConditionService.get_condition_details(project_id, document_id, condition_number)
            if not condition_details:
                return {"message": "Condition not found"}, HTTPStatus.NOT_FOUND

            # Instantiate the schema
            condition_details_schema = ProjectDocumentConditionDetailSchema()

            # Call dump on the schema instance
            return condition_details_schema.dump(condition_details), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit condition data")
    @API.response(
        code=HTTPStatus.OK, model=condition_model, description="Edit conditions"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def patch(project_id, document_id, condition_number):
        """Edit condition data."""
        try:
            conditions_data = ConditionSchema().load(API.payload)
            updated_condition = ConditionService.update_condition(
                project_id, document_id, condition_number, conditions_data)
            return ConditionSchema().dump(updated_condition), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("GET, OPTIONS")
@API.route("/project/<string:project_id>/document/<string:document_id>", methods=["GET", "OPTIONS"])
class ConditionDetailResource(Resource):
    """Resource for fetching condition details by project_id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get conditions by project id and document id")
    @API.response(code=HTTPStatus.CREATED, model=condition_model, description="Get conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(project_id, document_id):
        """Fetch conditions and condition attributes by project ID."""
        try:
            condition_details = ConditionService.get_all_conditions(project_id, document_id)
            if not condition_details:
                return {"message": "Condition not found"}, HTTPStatus.NOT_FOUND
            # Instantiate the schema
            condition_details_schema = ProjectDocumentConditionSchema()

            # Call dump on the schema instance
            return condition_details_schema.dump(condition_details), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
