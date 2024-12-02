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

from condition_api.models.document_type import DocumentType
from condition_api.models.project import Project
from condition_api.schemas.document import DocumentTypeSchema
from condition_api.schemas.project import DocumentSchema
from condition_api.services.document_service import DocumentService
from condition_api.utils.util import cors_preflight

from ..auth import auth
from .apihelper import Api as ApiHelper

API = Namespace("documents", description="Endpoints for Document Management")
"""Custom exception messages
"""

document_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, DocumentSchema(), "Document"
)

@cors_preflight("POST, OPTIONS")
@API.route("/project/<string:project_id>", methods=["POST", "OPTIONS"])
class DocumentsResource(Resource):
    """Resource for Document Management"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create new documents")
    @API.response(code=HTTPStatus.OK, model=document_model, description="Create documents")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def post(project_id):
        """Create a new document."""
        try:
            project_data = Project.get_by_id(project_id)
            if not project_data:
                return {"message": "No projects found"}, HTTPStatus.NOT_FOUND

            documents_data = DocumentSchema().load(API.payload)
            created_document = DocumentService.create_document(project_id, documents_data)

            # Call dump on the schema instance
            return DocumentSchema().dump(created_document), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("GET, OPTIONS")
@API.route("/type", methods=["GET", "OPTIONS"])
class DocumentTypeResource(Resource):
    """Resource for Document Type Management"""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all document type")
    @API.response(code=HTTPStatus.OK, model=document_model, description="Get all document type")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cors.crossdomain(origin="*")
    def get():
        """Get all document type."""
        try:
            document_type = DocumentType.get_all()
            if not document_type:
                return {}

            return DocumentTypeSchema(many=True).dump(document_type), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
