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

from flask import request

from flask_restx import Namespace, Resource, cors

from condition_api.exceptions import ConditionNumberExistsError,\
    ConditionNumberExistsInProjectError, ResourceNotFoundError
from condition_api.models.condition import Condition as ConditionModel
from condition_api.schemas.condition import ConditionSchema,\
    ProjectDocumentConditionDetailSchema, ProjectDocumentConditionSchema
from condition_api.services.condition_service import ConditionService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import cors_preflight

from marshmallow import ValidationError

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("conditions", description="Endpoints for Condition Management")
"""Custom exception messages
"""

condition_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ConditionSchema(), "Condition"
)


@cors_preflight("GET, OPTIONS, PATCH")
@API.route("/project/<string:project_id>/document/<string:document_id>/condition/<int:condition_id>",
           methods=["PATCH", "GET", "OPTIONS"])
class ConditionDetailsResource(Resource):
    """Resource for fetching condition details by project_id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get conditions by project id")
    @API.response(code=HTTPStatus.CREATED, model=condition_model, description="Get conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def get(project_id, document_id, condition_id):
        """Fetch conditions and condition attributes by project ID."""
        try:
            condition_details = ConditionService.get_condition_details(project_id, document_id, condition_id)
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
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    def patch(condition_id):
        """Edit condition data."""
        try:
            conditions_data = ConditionSchema().load(API.payload)
            query_params = request.args
            check_condition_exists = query_params.get('check_condition_exists', '', type=str)
            check_condition_over_project = query_params.get('check_condition_over_project', '', type=str)
            updated_condition = ConditionService.update_condition(
                conditions_data, condition_id, check_condition_exists,
                check_condition_over_project)
            return ConditionSchema().dump(updated_condition), HTTPStatus.OK
        except ConditionNumberExistsError as err:
            return {"message": str(err)}, HTTPStatus.CONFLICT
        except ConditionNumberExistsInProjectError as err:
            response = {
                "message": str(err),
                "is_amendment": err.is_amendment
            }
            return response, HTTPStatus.PRECONDITION_FAILED
        except ValueError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("GET, POST, OPTIONS")
@API.route("/project/<string:project_id>/document/<string:document_id>", methods=["GET", "POST", "OPTIONS"])
class ConditionDetailResource(Resource):
    """Resource for fetching or adding condition for a project and document."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get conditions by project id and document id")
    @API.response(code=HTTPStatus.CREATED, model=condition_model, description="Get conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def get(project_id, document_id):
        """Fetch conditions and condition attributes by project ID."""
        try:
            query_params = request.args
            include_nested_conditions = query_params.get('include_subconditions', '', type=str)
            condition_details = ConditionService.get_all_conditions(
                project_id, document_id, include_nested_conditions)
            if not condition_details:
                return {}
            # Instantiate the schema
            condition_details_schema = ProjectDocumentConditionSchema()

            # Call dump on the schema instance
            return condition_details_schema.dump(condition_details), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create new condition")
    @API.response(code=HTTPStatus.OK, model=condition_model, description="Create condition")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def post(project_id, document_id):
        """Create a new condition."""
        try:
            payload = API.payload or {}
            if payload and payload != {}:
                conditions_data = ConditionSchema().load(API.payload)
            else:
                conditions_data = {}
            created_condition = ConditionService.create_condition(project_id, document_id, conditions_data)
            return created_condition, HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("GET, OPTIONS, PATCH, DELETE")
@API.route("/<int:condition_id>", methods=["PATCH", "GET", "DELETE", "OPTIONS"])
class ConditionResource(Resource):
    """Resource for fetching condition details by condition id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get conditions by condition id")
    @API.response(code=HTTPStatus.CREATED, model=condition_model, description="Get conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def get(condition_id):
        """Fetch conditions and condition attributes by condition ID."""
        try:
            condition_details = ConditionService.get_condition_details_by_id(condition_id)
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
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    def patch(condition_id):
        """Edit condition data."""
        try:
            conditions_data = ConditionSchema().load(API.payload)
            query_params = request.args
            check_condition_over_project = query_params.get(
                'check_condition_over_project', 'true').lower() == 'true'
            updated_condition = ConditionService.update_condition(conditions_data,
                                                                  condition_id, True,
                                                                  check_condition_over_project)
            return ConditionSchema().dump(updated_condition), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
        except ConditionNumberExistsError as err:
            return {"message": str(err)}, HTTPStatus.CONFLICT
        except ConditionNumberExistsInProjectError as err:
            response = {
                "message": str(err),
                "is_amendment": err.is_amendment
            }
            return response, HTTPStatus.PRECONDITION_FAILED
        except ValueError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete condition data")
    @API.response(
        code=HTTPStatus.OK, model=condition_model, description="Delete conditions"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    def delete(condition_id):
        """Remove condition data."""
        try:
            condition_exists = ConditionModel.get_by_id(condition_id)
            if not condition_exists:
                raise ResourceNotFoundError("Condition data not found")
            ConditionService().delete_condition(condition_id)
            return 'Condition successfully removed', HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
