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
"""API endpoints for managing a subcondition resource."""


from http import HTTPStatus
from flask_restx import Namespace, Resource, cors
from marshmallow import ValidationError

from condition_api.schemas.condition import SubConditionSchema
from condition_api.services.subcondition_service import SubConditionService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("subconditions", description="Endpoints for Sub Condition Management")
"""Custom exception messages
"""

subcondition_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, SubConditionSchema(), "Submission"
)

@cors_preflight("PATCH, OPTIONS")
@API.route("", methods=["PATCH", "OPTIONS"])
class Subconditions(Resource):
    """Resource for managing subconditions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit a subcondition")
    @API.response(
        code=HTTPStatus.OK, model=subcondition_model, description="Subcondition"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def patch():
        """Edit multiple subconditions."""
        try:
            subconditions_data = SubConditionSchema(many=True).load(API.payload)
            updated_subconditions = SubConditionService.update_subconditions(subconditions_data)
            return SubConditionSchema(many=True).dump(updated_subconditions), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
