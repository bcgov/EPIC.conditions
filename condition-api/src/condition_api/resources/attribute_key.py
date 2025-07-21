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
"""API endpoints for managing a attribute key resource."""

from http import HTTPStatus

from flask import request

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from marshmallow import ValidationError

from condition_api.schemas.attribute_key import AttributeKeySchema
from condition_api.services.attribute_key_service import AttributeKeyService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("attributekeys", description="Endpoints for attribute key Management")
"""Custom exception messages
"""

attributes_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, AttributeKeySchema(), "AttributeKey"
)


@cors_preflight("GET, OPTIONS")
@API.route("/condition/<int:condition_id>", methods=["GET", "OPTIONS"])
class AttributeKeyResource(Resource):
    """Resource for fetching attribute keys."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get attribute keys")
    @API.response(code=HTTPStatus.CREATED, model=attributes_model, description="Get attribute keys")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def get(condition_id):
        """Fetch attribute keys."""
        management_plan_id = request.args.get("management_plan_id", type=int)
        try:
            attributes = AttributeKeyService.get_all_attributes(condition_id, management_plan_id)
            if not attributes:
                return []
            # Instantiate the schema
            attribute_key_schema = AttributeKeySchema(many=True)

            # Call dump on the schema instance
            return attribute_key_schema.dump(attributes), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
