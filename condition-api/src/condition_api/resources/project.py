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
"""API endpoints for managing a project resource."""

from http import HTTPStatus

from flask_cors import cross_origin
from flask_restx import Namespace, Resource

from marshmallow import ValidationError

from condition_api.schemas.project import ProjectSchema
from condition_api.services.project_service import ProjectService
from condition_api.utils.roles import EpicConditionRole
from condition_api.utils.util import allowedorigins, cors_preflight

from .apihelper import Api as ApiHelper
from ..auth import auth

API = Namespace("projects", description="Endpoints for Project Management")
"""Custom exception messages
"""

projects_model = ApiHelper.convert_ma_schema_to_restx_model(
    API, ProjectSchema(), "Projects"
)


@cors_preflight("GET, OPTIONS")
@API.route("", methods=["GET", "OPTIONS"])
class ProjectsResource(Resource):
    """Resource for fetching all projects."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all projects")
    @API.response(code=HTTPStatus.OK, model=projects_model, description="Get projects")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.has_one_of_roles([EpicConditionRole.VIEW_CONDITIONS.value])
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch projects and related documents."""
        try:
            project_data = ProjectService.get_all_projects()
            if not project_data:
                return {"message": "No projects found"}, HTTPStatus.NOT_FOUND

            projects_schema = ProjectSchema(many=True)

            # Call dump on the schema instance
            return projects_schema.dump(project_data), HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST


@cors_preflight("GET, OPTIONS")
@API.route("/with-approved-conditions", methods=["GET", "OPTIONS"])
class ApprovedProjectsResource(Resource):
    """Resource for fetching all projects with approved conditions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description="Get all projects with approved conditions")
    @API.response(code=HTTPStatus.OK, model=projects_model, description="Get projects with approved conditions")
    @API.response(HTTPStatus.BAD_REQUEST, "Bad Request")
    @auth.require
    @cross_origin(origins=allowedorigins())
    def get():
        """Fetch projects with approved conditions."""
        try:
            project_data = ProjectService.get_projects_with_approved_conditions()
            if not project_data:
                return {"message": "No projects found"}, HTTPStatus.NOT_FOUND

            results = [{"epic_guid": pid[0]} for pid in project_data]

            return results, HTTPStatus.OK
        except ValidationError as err:
            return {"message": str(err)}, HTTPStatus.BAD_REQUEST
