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
"""API endpoints for managing a amendment resource."""

from http import HTTPStatus

from flask_restx import Namespace, Resource, cors

from condition_api.models.document import Document
from condition_api.schemas.amendment import AmendmentSchema
from condition_api.services.amendment_service import AmendmentService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import cors_preflight

from marshmallow import ValidationError

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("amendments", description="Endpoints for Amendment Management")
"""Custom exception messages
"""

amendment_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, AmendmentSchema(), "Amendment"
)


@cors_preflight("POST, OPTIONS")
@API.route("/document/<string:document_id>", methods=["POST", "OPTIONS"])
class AmendmentsResource(Resource):
    """Resource for Amendment Management"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create new amendments")
    @API.response(code=HTTPStatus.OK, model=amendment_model, description="Create amendments")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cors.crossdomain(origin="*")
    def post(document_id):
        """Create a new amendment."""
        try:
            document_data = Document.get_by_id(document_id)
            if not document_data:
                return {"message": "No document found"}, HTTPStatus.NOT_FOUND

            amendments_data = AmendmentSchema().load(API.payload)
            created_amendment = AmendmentService.create_amendment(document_id, amendments_data)

            # Call dump on the schema instance
            return AmendmentSchema().dump(created_amendment), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
