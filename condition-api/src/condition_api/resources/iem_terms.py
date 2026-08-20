"""API endpoints for managing IEM Terms of Engagement."""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from marshmallow import ValidationError

from condition_api.models.iem_terms import IEMTerms
from condition_api.schemas.iem_terms import IEMTermsSchema
from condition_api.services.iem_terms import IEMTermsService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("iemterms", description="Endpoints for IEM Terms of Engagement management")

iem_terms_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, IEMTermsSchema(), "IEMTerms"
)


@cors_preflight("OPTIONS, PATCH, DELETE")
@API.route("/<int:terms_id>", methods=["PATCH", "DELETE", "OPTIONS"])
class IEMTermsResource(Resource):
    """Resource for updating IEM Terms of Engagement."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Edit IEM Terms data")
    @API.response(code=HTTPStatus.OK, model=iem_terms_model, description="Edit IEM Terms")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def patch(terms_id):
        """Edit IEM Terms data."""
        try:
            payload = API.payload or {}
            updated_terms = IEMTermsService.update_iem_terms(terms_id, payload)
            return IEMTermsSchema().dump(updated_terms), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete IEM Terms data")
    @API.response(code=HTTPStatus.OK, model=iem_terms_model, description="Delete IEM Terms")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def delete(terms_id):
        """Remove IEM Terms data."""
        try:
            deleted = IEMTerms().delete_by_id(terms_id)
            if not deleted:
                return 'No IEM Terms data found to remove', HTTPStatus.OK
            return 'IEM Terms successfully removed', HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
