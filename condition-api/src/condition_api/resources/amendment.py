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
from marshmallow import ValidationError

from condition_api.schemas.document import ProjectDocumentAllAmendmentsSchema
from condition_api.services.document_service import DocumentService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("amendments", description="Endpoints for Amendment Management")
"""Custom exception messages
"""

amendment_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProjectDocumentAllAmendmentsSchema(), "Amendment"
)

@cors_preflight("GET, OPTIONS")
@API.route("/project/<string:project_id>/document/<string:document_id>", methods=["GET", "OPTIONS"])
class AmendmentResource(Resource):
    """Resource for fetching document and its amendments for the given project id and document id."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get document and its amendments for the given project id and document id")
    @API.response(code=HTTPStatus.CREATED, model=amendment_model, description="Get amendments")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(project_id, document_id):
        """Fetch document and its amendments for the given project id and document id."""
        try:
            amendments = DocumentService.get_documents_with_amendments(project_id, document_id)
            if not amendments:
                return {"message": "Amendment not found"}, HTTPStatus.NOT_FOUND
            # Instantiate the schema
            amendments_schema = ProjectDocumentAllAmendmentsSchema()

            # Call dump on the schema instance
            return amendments_schema.dump(amendments), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
