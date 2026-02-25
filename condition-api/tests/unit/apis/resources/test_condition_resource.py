"""Test Condition.

Test for condition.
"""
import json
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.services.condition_service import ConditionService
from condition_api.exceptions import (
    ConditionNumberExistsError,
    ConditionNumberExistsInProjectError,
)
from marshmallow import ValidationError
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_condition_model,
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


@pytest.fixture
def setup_condition(session):
    """Create a project, document and condition for testing."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    session.add_all([project, document, condition])
    session.commit()
    return condition


def test_get_condition_with_data(client, auth_user):
    """GET condition by id returns condition"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)

    response = client.get(
        f"/api/conditions/project/{project.project_id}/document/{document.document_id}/condition/{condition.id}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    # Assert condition_id matches
    assert str(data['condition']['condition_id']) == str(condition.id)


def test_get_condition_empty(client, monkeypatch, auth_user):
    """GET condition by id returns empty when no condition exist"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    # Mock the service
    monkeypatch.setattr(
        ConditionService,
        "get_condition_details",
        lambda *args, **kwargs: {}
    )

    response = client.get(
        f"/api/conditions/project/{project.project_id}/document/{document.document_id}/condition/{0}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.NOT_FOUND


def test_get_condition_validation_error(client, auth_user, monkeypatch):
    """Simulate validation error in get_condition_details."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    # Monkeypatch service to raise ValidationError
    def mock_get_condition_details(project_id, document_id, condition_id):
        raise ValidationError("Bad data")

    monkeypatch.setattr(
        ConditionService,
        "get_condition_details",
        mock_get_condition_details
    )

    response = client.get(
        f"/api/conditions/project/{project.project_id}/document/{document.document_id}/condition/{0}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST


def test_patch_condition_success(client, mocker, auth_user, setup_condition):
    """Test successful patch of condition data."""
    condition_id = setup_condition.id
    payload = {"condition_text": "Updated condition text"}

    updated_condition = setup_condition
    updated_condition.condition_text = "Updated condition text"

    mocker.patch.object(
        ConditionService,
        "update_condition",
        return_value=updated_condition,
    )

    rv = client.patch(
        f"/api/conditions/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.json["condition_text"] == "Updated condition text"


def test_patch_condition_conflict(client, mocker, setup_condition, auth_user):
    """Test patch raising ConditionNumberExistsError → 409."""
    condition_id = setup_condition.id
    payload = {"condition_number": 1}

    mocker.patch.object(
        ConditionService,
        "update_condition",
        side_effect=ConditionNumberExistsError("Condition number already exists"),
    )

    rv = client.patch(
        f"/api/conditions/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.CONFLICT
    assert "already exists" in rv.json["message"]


def test_patch_condition_precondition_failed(client, mocker, setup_condition, auth_user):
    """Test patch raising ConditionNumberExistsInProjectError → 412."""
    condition_id = setup_condition.id
    payload = {"condition_number": 2}

    mocker.patch.object(
        ConditionService,
        "update_condition",
        side_effect=ConditionNumberExistsInProjectError(
            "Condition exists in project", is_amendment=True
        ),
    )

    rv = client.patch(
        f"/api/conditions/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.PRECONDITION_FAILED
    assert "exists in project" in rv.json["message"]
    assert rv.json["is_amendment"] is True


def test_patch_condition_bad_request(client, mocker, setup_condition, auth_user):
    """Test patch raising ValueError → 400."""
    condition_id = setup_condition.id
    payload = {"condition_number": "invalid"}  # invalid value to trigger ValueError

    mocker.patch.object(
        ConditionService,
        "update_condition",
        side_effect=ValueError("Invalid data"),
    )

    rv = client.patch(
        f"/api/conditions/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST


def test_get_conditions_success(client, auth_user):
    """Test fetching conditions successfully."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)

    response = client.get(
        f"/api/conditions/project/{project.project_id}/document/{document.document_id}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    assert len(data["conditions"]) == 1  # one condition created
    first_condition = data["conditions"][0]
    assert str(first_condition["condition_id"]) == str(condition.id)
    assert first_condition["condition_name"] == condition.condition_name


def test_post_condition(client, auth_header, monkeypatch):
    """Test creating a condition successfully."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    created_condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id)

    monkeypatch.setattr(
        ConditionService,
        "create_condition",
        lambda pid, did, data, allow_dup, check_proj: {"condition_id": created_condition.id}
    )

    response = client.post(
        f"/api/conditions/project/{project.project_id}/document/{document.document_id}?allow_duplicate_condition=false",
        data=json.dumps({}),
        content_type="application/json",
        headers=auth_header,
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["condition_id"] == created_condition.id


def test_get_condition_by_id_success(client, auth_user, setup_condition):
    """Test fetching condition successfully."""
    condition = setup_condition

    response = client.get(f"/api/conditions/{condition.id}", headers=auth_user)

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert str(data["condition"]["condition_id"]) == str(condition.id)


def test_get_condition_by_id_not_found(client, auth_user, monkeypatch):
    """Test fetching non-existent condition."""
    monkeypatch.setattr(
        ConditionService,
        "get_condition_details_by_id",
        lambda cid: None
    )

    response = client.get("/api/conditions/999999", headers=auth_user)

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.get_json()["message"] == "Condition not found"


def test_patch_condition_by_id_success(client, auth_user, setup_condition, mocker):
    """Test editing a condition successfully."""
    condition_id = setup_condition.id
    updated_data = {"condition_name": "Updated Name"}

    updated_condition = setup_condition
    updated_condition.condition_name = "Updated Name"

    mocker.patch.object(
        ConditionService,
        "update_condition",
        return_value=updated_condition,
    )

    response = client.patch(
        f"/api/conditions/{condition_id}?allow_duplicate_condition=true",
        data=json.dumps(updated_data),
        headers=auth_user,
        content_type="application/json"
    )

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["condition_name"] == updated_data["condition_name"]


def test_patch_condition_by_id_conflict(client, auth_user, setup_condition, monkeypatch):
    """Test editing condition with duplicate number raises conflict."""
    monkeypatch.setattr(
        ConditionService,
        "update_condition",
        lambda *_, **__: (_ for _ in ()).throw(ConditionNumberExistsError("Duplicate"))
    )

    response = client.patch(
        f"/api/conditions/{setup_condition.id}",
        data=json.dumps({"condition_name": "New"}),
        headers=auth_user,
        content_type="application/json"
    )

    assert response.status_code == HTTPStatus.CONFLICT
    assert "Duplicate" in response.get_json()["message"]


def test_patch_condition_by_id_precondition_failed(client, auth_user, setup_condition, monkeypatch):
    """Test editing condition fails with project-level duplicate."""
    monkeypatch.setattr(
        ConditionService,
        "update_condition",
        lambda *_, **__: (_ for _ in ()).throw(
            ConditionNumberExistsInProjectError("Exists in project", is_amendment=True)
        )
    )

    response = client.patch(
        f"/api/conditions/{setup_condition.id}?allow_duplicate_condition=false",
        data=json.dumps({"condition_name": "Something"}),
        headers=auth_user,
        content_type="application/json"
    )

    assert response.status_code == HTTPStatus.PRECONDITION_FAILED
    data = response.get_json()
    assert data["message"] == "Exists in project"
    assert data["is_amendment"] is True


def test_delete_condition_by_id_success(client, auth_user, setup_condition):
    """Test deleting a condition successfully."""
    condition = setup_condition

    response = client.delete(f"/api/conditions/{condition.id}", headers=auth_user)

    assert response.status_code == HTTPStatus.OK
    assert "successfully" in response.get_data(as_text=True)


def test_delete_condition_by_id_not_found(client, auth_user):
    """Test deleting a non-existent condition raises not found."""
    response = client.delete("/api/conditions/99999", headers=auth_user)

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert "not found" in response.get_json()["message"]


def test_get_consolidated_conditions_success(client, auth_user, setup_condition):
    """Test consolidated conditions."""
    condition = setup_condition
    project_id = condition.project_id

    response = client.get(
        f"/api/conditions/project/{project_id}?all_conditions=true&include_attributes=true",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, dict)
    assert "conditions" in data
    assert isinstance(data["conditions"], list)
    assert str(data["conditions"][0]["condition_id"]) == str(condition.id)
    assert data["conditions"][0]["condition_name"] == condition.condition_name


def test_get_consolidated_conditions_not_found(client, auth_user):
    """Test consolidated conditions not found."""
    project_id = 999

    response = client.get(
        f"/api/conditions/project/{project_id}?all_conditions=true&include_attributes=true",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    data = response.get_json()
    assert data["message"] == "Condition not found"
