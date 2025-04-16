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
"""API endpoints for managing an staff user resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from condition_api.exceptions import BadRequestError, ResourceNotFoundError
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import cors_preflight

from ..auth import auth
from ..schemas.staff_user import StaffUserSchema
from ..services.staff_user_service import StaffUserService
from .apihelper import Api as ApiHelper


API = Namespace("users", description="Endpoints for Staff User Management")
"""Custom exception messages
"""

user_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, StaffUserSchema(), "User"
)


@cors_preflight("OPTIONS, POST")
@API.route("", methods=["POST", "OPTIONS"])
class Users(Resource):
    """Resource for managing staff users."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a staff user")
    @API.expect(user_model)
    @API.response(code=HTTPStatus.CREATED, model=user_model, description="Staff user Created")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def post():
        """Create a staff user."""
        created_account = StaffUserService.create_or_update_staff_user(API.payload)
        if not created_account:
            return BadRequestError(f"Staff user cannot be created")
        return StaffUserSchema().dump(created_account), HTTPStatus.CREATED


@cors_preflight("GET, OPTIONS")
@API.route("/guid/<string:guid>", methods=["GET", "OPTIONS"])
@API.doc(params={"guid": "The user global unique identifier"})
class User(Resource):
    """Resource for managing a single staff user"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Fetch a user by guid")
    @API.response(code=200, model=user_model, description="Success")
    @API.response(404, "Not Found")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(guid):
        """Fetch a staff user by id."""
        user = StaffUserService.get_by_auth_guid(guid)
        if not user:
            return ResourceNotFoundError(f"User with guid {guid} not found")
        return StaffUserSchema().dump(user), HTTPStatus.OK
