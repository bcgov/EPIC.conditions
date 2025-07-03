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
"""API endpoints for managing a management plan resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from marshmallow import ValidationError

from condition_api.models.management_plan import ManagementPlan
from condition_api.schemas.management_plan import ManagementPlanSchema
from condition_api.services.management_plan import ManagementPlanService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("managementplan", description="Endpoints for management plan management")
"""Custom exception messages
"""

management_plan_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ManagementPlanSchema(), "ManagementPlan"
)


@cors_preflight("OPTIONS, PATCH, DELETE")
@API.route("/<int:plan_id>", methods=["PATCH", "DELETE", "OPTIONS"])
class ManagementPlanResource(Resource):
    """Resource for updating management plans."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit management plan data")
    @API.response(
        code=HTTPStatus.OK, model=management_plan_model, description="Edit management plan"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    def patch(plan_id):
        """Edit management plan data."""
        try:
            payload = API.payload or {}
            updated_management_plan = ManagementPlanService.update_management_plan_name(
                plan_id, payload)
            return ManagementPlanSchema().dump(updated_management_plan), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete management plan data")
    @API.response(
        code=HTTPStatus.OK, model=management_plan_model, description="Delete management plans"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    def delete(plan_id):
        """Remove management plan data."""
        try:
            deleted = ManagementPlan().delete_by_id(plan_id)
            if not deleted:
                # No data found to delete, but still OK
                return 'No management plans data found to remove', HTTPStatus.OK
            return 'Management plans successfully removed', HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
