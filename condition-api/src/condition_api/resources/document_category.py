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
"""API endpoints for managing a document resource."""

from http import HTTPStatus
from flask_restx import Namespace, Resource, cors
from marshmallow import ValidationError

from condition_api.schemas.document import ProjectDocumentAllAmendmentsSchema
from condition_api.services.document_service import DocumentService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("document-category", description="Endpoints for Document Management")
"""Custom exception messages
"""

document_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProjectDocumentAllAmendmentsSchema(), "Document"
)

@cors_preflight("GET, OPTIONS")
@API.route("/project/<string:project_id>/category/<int:category_id>", methods=["GET", "OPTIONS"])
class DocumentResource(Resource):
    """Resource for fetching all document for a document category."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all documents")
    @API.response(code=HTTPStatus.OK, model=document_model, description="Get documents")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get(project_id, category_id):
        """Fetch document category and related documents."""
        try:
            documents_data = DocumentService.get_all_documents_by_category(project_id, category_id)
            if not documents_data:
                return {"message": "No documents found"}, HTTPStatus.NOT_FOUND

            document_schema = ProjectDocumentAllAmendmentsSchema()

            # Call dump on the schema instance
            return document_schema.dump(documents_data), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
