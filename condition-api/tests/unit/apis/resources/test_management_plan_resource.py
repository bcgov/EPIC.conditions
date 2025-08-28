"""Test Management Plan.

Test for management plan.
"""
import json
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.models.management_plan import ManagementPlan
from condition_api.services.management_plan import ManagementPlanService
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_condition_model,
    factory_management_plan_model,
    factory_project_model,
    factory_user_model,
    factory_document_model,
    get_seeded_document_type,
    factory_auth_header
)

CONFIG = get_named_config("testing")


@pytest.fixture
def auth_user(session, jwt):
    """Create an authorized user and return headers"""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    factory_user_model(auth_guid=auth_guid)
    session.flush()
    headers = factory_auth_header(jwt=jwt, claims=TestJwtClaims.staff_admin_role)
    return headers


def test_patch_management_plan_success(client, auth_user, mocker):
    """Test successful PATCH of a management plan."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    management_plan = factory_management_plan_model(condition_id=condition.id)
    payload = {"name": "Updated Plan Name"}

    # Mock the service method to return the updated plan
    mocker.patch.object(
        ManagementPlanService,
        "update_management_plan_name",
        return_value=management_plan
    )

    # Act
    response = client.patch(
        f"/api/managementplan/{management_plan.id}",
        data=json.dumps(payload),
        headers=auth_user,
        content_type="application/json"
    )

    # Assert
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["name"] == management_plan.name


def test_patch_management_plan_validation_error(client, auth_user, mocker):
    """Test PATCH failing due to schema validation error."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    management_plan = factory_management_plan_model(condition_id=condition.id)
    payload = {"name": ""}  # Invalid name to trigger validation error

    # Mock the service method to raise ValidationError
    from marshmallow import ValidationError
    mocker.patch.object(
        ManagementPlanService,
        "update_management_plan_name",
        side_effect=ValidationError("Invalid data")
    )

    response = client.patch(
        f"/api/managementplan/{management_plan.id}",
        data=json.dumps(payload),
        headers=auth_user,
        content_type="application/json"
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    data = response.get_json()
    assert "Invalid data" in data["message"]


def test_delete_management_plan_success(client, auth_user, mocker):
    """Test successful DELETE of a management plan."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    management_plan = factory_management_plan_model(condition_id=condition.id)

    response = client.delete(
        f"/api/managementplan/{management_plan.id}",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.OK
    assert response.get_data(as_text=True) == "Management plans successfully removed"


def test_delete_management_plan_bad_request(client, auth_user, mocker):
    """Test DELETE raises a KeyError or ValueError (BAD_REQUEST)."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    management_plan = factory_management_plan_model(condition_id=condition.id)

    # Mock delete_by_id to raise ValueError
    mocker.patch.object(
        ManagementPlan,
        "delete_by_id",
        side_effect=ValueError("Invalid delete")
    )

    response = client.delete(
        f"/api/managementplan/{management_plan.id}",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    data = response.get_json()
    assert "Invalid delete" in data["message"]
