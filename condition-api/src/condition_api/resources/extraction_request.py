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


@cors_preflight("GET, POST, OPTIONS")
@API.route("", methods=["GET", "POST", "OPTIONS"])
class ExtractionRequestsResource(Resource):
    """Resource for creating extraction requests."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all extraction requests")
    @API.response(code=HTTPStatus.OK, model=[extraction_request_model], description="Success")
    @auth.has_one_of_roles([EpicConditionRole.EXTRACT_CONDITIONS.value, EpicConditionRole.VIEW_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def get():
        """Get all extraction requests."""
        from flask import request
        status_filter = request.args.get('status')
        results = ExtractionRequestService.get_all(status_filter=status_filter)
        return ExtractionRequestSchema(many=True).dump(results), HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create an extraction request")
    @API.response(code=HTTPStatus.CREATED, model=extraction_request_model, description="Extraction request created")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.EXTRACT_CONDITIONS.value, EpicConditionRole.VIEW_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def post():
        """Create a new extraction request with status pending."""
        try:
            data = ExtractionRequestSchema().load(API.payload)
            result = ExtractionRequestService.create(data)
            return ExtractionRequestSchema().dump(result), HTTPStatus.CREATED
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("PATCH, POST, OPTIONS")
@API.route("/<int:request_id>/<string:action>", methods=["PATCH", "POST", "OPTIONS"])
class ExtractionRequestActionResource(Resource):
    """Resource for actions on extraction requests (import, reject)."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Perform action on an extraction request")
    @API.response(code=HTTPStatus.OK, model=extraction_request_model, description="Action successful")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.EXTRACT_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def post(request_id, action):
        """Perform action (import)."""
        try:
            if action == 'import':
                result = ExtractionRequestService.import_request(request_id)
                return ExtractionRequestSchema().dump(result), HTTPStatus.OK
            return {"message": "Invalid POST action"}, HTTPStatus.BAD_REQUEST
        except ValueError as e:
            return {"message": str(e)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Update extraction request status")
    @API.response(code=HTTPStatus.OK, model=extraction_request_model, description="Status updated")
    @auth.has_one_of_roles([EpicConditionRole.EXTRACT_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def patch(request_id, action):
        """Perform action (reject)."""
        try:
            if action == 'reject':
                result = ExtractionRequestService.reject_request(request_id)
                return ExtractionRequestSchema().dump(result), HTTPStatus.OK
            return {"message": "Invalid PATCH action"}, HTTPStatus.BAD_REQUEST
        except ValueError as e:
            return {"message": str(e)}, HTTPStatus.BAD_REQUEST
