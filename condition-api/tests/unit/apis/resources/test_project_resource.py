"""Test Project.

Test for project.
"""
from http import HTTPStatus

from condition_api import get_named_config
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_project_model, factory_condition_model, factory_auth_header, factory_user_model,
    factory_document_model, get_seeded_document_type
)

CONFIG = get_named_config("testing")


def test_get_requires_auth(client):
    """Test endpoints require authentication."""
    response = client.get('/api/projects')
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_projects_success(client, session, jwt):
    """Test get all projects."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)

    # Setup project link
    factory_project_model(project_name="TestProject")

    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.get("/api/projects", headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    # Assert that at least one project has the expected name
    project_names = [proj["project_name"] for proj in data]
    assert "TestProject" in project_names


def test_get_projects_not_found(client, session, jwt):
    """Test 404 returned when no projects found."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)

    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.get("/api/projects", headers=headers)

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.get_json()["message"] == "No projects found"


def test_get_projects_with_approved_conditions(client, session, jwt):
    """Test fetching projects with approved conditions."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)

    # create a project
    project = factory_project_model()

    doc_type = get_seeded_document_type("Certificate")

    # create a document
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    # Attach a condition with desired approval status
    factory_condition_model(
        document_id=document.document_id, project_id=project.project_id, is_approved=True)

    session.flush()

    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)

    response = client.get("/api/projects/with-approved-conditions", headers=headers)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, list)

    # Collect all returned IDs
    project_ids = [proj["epic_guid"] for proj in data]

    # Assert that our seeded project is in the response
    assert project.project_id in project_ids, f"{project.project_id} not found in {project_ids}"
