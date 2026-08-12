"""API endpoints for report and report submission management."""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from marshmallow import ValidationError

from condition_api.models.report import Report
from condition_api.models.report_submission import ReportSubmission
from condition_api.schemas.report import ReportSchema, ReportSubmissionSchema
from condition_api.services.report_service import ReportService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("reports", description="Endpoints for report management")

report_model = ApiHelper.convert_ma_schema_to_restx_model(API, ReportSchema(), "Report")
submission_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ReportSubmissionSchema(), "ReportSubmission"
)


@cors_preflight("OPTIONS, GET, POST")
@API.route("/condition/<int:condition_id>", methods=["GET", "POST", "OPTIONS"])
class ReportListResource(Resource):
    """Resource for listing and creating reports for a condition."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all reports for a condition")
    @API.response(code=HTTPStatus.OK, description="List of reports")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.require
    def get(condition_id):
        """Fetch all reports for a condition."""
        try:
            reports = ReportService.get_reports_by_condition(condition_id)
            return reports, HTTPStatus.OK
        except Exception as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Create a new report for a condition")
    @API.response(code=HTTPStatus.CREATED, description="Report created")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def post(condition_id):
        """Create a report with its submissions."""
        try:
            payload = API.payload or {}
            report = ReportService.create_report(condition_id, payload)
            return report, HTTPStatus.CREATED
        except (ValidationError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("OPTIONS, PATCH, DELETE")
@API.route("/<int:report_id>", methods=["PATCH", "DELETE", "OPTIONS"])
class ReportResource(Resource):
    """Resource for updating and deleting a report."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Update report metadata")
    @API.response(code=HTTPStatus.OK, description="Report updated")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def patch(report_id):
        """Update report metadata."""
        try:
            payload = API.payload or {}
            report = ReportService.update_report(report_id, payload)
            return report, HTTPStatus.OK
        except (ValidationError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete a report")
    @API.response(code=HTTPStatus.OK, description="Report deleted")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def delete(report_id):
        """Remove a report and all its submissions."""
        try:
            deleted = ReportService.delete_report(report_id)
            if not deleted:
                return "No report found to remove", HTTPStatus.OK
            return "Report successfully removed", HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("OPTIONS, POST")
@API.route("/<int:report_id>/submissions", methods=["POST", "OPTIONS"])
class ReportSubmissionListResource(Resource):
    """Resource for adding submissions to a report."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Add submission(s) to a report")
    @API.response(code=HTTPStatus.CREATED, description="Submission(s) created")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def post(report_id):
        """Add one or more phase submissions to a report."""
        try:
            payload = API.payload or {}
            submissions = ReportService.add_submission(report_id, payload)
            return submissions, HTTPStatus.CREATED
        except (ValidationError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("OPTIONS, PATCH, DELETE")
@API.route("/submissions/<int:submission_id>", methods=["PATCH", "DELETE", "OPTIONS"])
class ReportSubmissionResource(Resource):
    """Resource for updating and deleting a report submission."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Update a report submission")
    @API.response(code=HTTPStatus.OK, description="Submission updated")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def patch(submission_id):
        """Update a report submission (phase, frequency, timing, is_approved)."""
        try:
            payload = API.payload or {}
            submission = ReportService.update_submission(submission_id, payload)
            return submission, HTTPStatus.OK
        except (ValidationError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Delete a report submission")
    @API.response(code=HTTPStatus.OK, description="Submission deleted")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @cross_origin(origins=allowedorigins())
    @auth.has_one_of_roles([EpicConditionRole.MANAGE_CONDITIONS.value])
    def delete(submission_id):
        """Remove a report submission."""
        try:
            deleted = ReportSubmission.delete_by_id(submission_id)
            if not deleted:
                return "No submission found to remove", HTTPStatus.OK
            return "Submission successfully removed", HTTPStatus.OK
        except (KeyError, ValueError) as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
