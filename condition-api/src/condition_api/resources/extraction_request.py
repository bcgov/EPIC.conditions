"""API endpoints for extraction requests."""
from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from condition_api.schemas.extraction_request import ExtractionRequestSchema
from condition_api.services.extraction_request_service import ExtractionRequestService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("extraction-requests", description="Endpoints for Extraction Request Management")

extraction_request_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ExtractionRequestSchema(), "ExtractionRequest"
)


@cors_preflight("POST, OPTIONS")
@API.route("", methods=["POST", "OPTIONS"])
class ExtractionRequestsResource(Resource):
    """Resource for creating extraction requests."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an extraction request")
    @API.response(code=HTTPStatus.CREATED, model=extraction_request_model, description="Extraction request created")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.EXTRACT_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def post():
        """Create a new extraction request with status pending."""
        try:
            data = ExtractionRequestSchema().load(API.payload)
            result = ExtractionRequestService.create(data)
            return ExtractionRequestSchema().dump(result), HTTPStatus.CREATED
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
