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
"""API endpoints for managing a condition attribute resource."""

from http import HTTPStatus
from flask_restx import Namespace, Resource, cors
from marshmallow import ValidationError

from condition_api.schemas.condition import ConditionAttributeSchema
from condition_api.services.condition_attribute_service import ConditionAttributeService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("attributes", description="Endpoints for Condition Attribute Management")
"""Custom exception messages
"""

condition_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ConditionAttributeSchema(), "Attribute"
)

@cors_preflight("OPTIONS, PATCH")
@API.route("/condition/<int:condition_id>", methods=["PATCH", "OPTIONS"])
class ConditionAttributeaResource(Resource):
    """Resource for updating condition attributes."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit condition attributes data")
    @API.response(
        code=HTTPStatus.OK, model=condition_model, description="Edit condition attributes"
    )
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cors.crossdomain(origin="*")
    @auth.require
    def patch(condition_id):
        """Edit condition attributes data."""
        try:
            conditions_attributes_data = ConditionAttributeSchema(many=True).load(API.payload)
            updated_conditions_attributes = ConditionAttributeService.upsert_condition_attribute(
                condition_id, conditions_attributes_data)
            return ConditionAttributeSchema(many=True).dump(updated_conditions_attributes), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
