"""Test Condition Attribute.

Test for condition attribute.
"""
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.services.condition_attribute_service import ConditionAttributeService
from marshmallow import ValidationError
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_condition_model,
    factory_condition_attribute_model,
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


def test_patch_condition_attribute_success(client, mocker, auth_user):
    """Test successful patch of condition data."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )

    condition_id = condition.id
    payload = {
        "requires_management_plan": False,
        "condition_attribute": {
            "independent_attributes": [
                {
                    "id": f"{(0) + 1}-1756415689392",
                    "key": "Submitted to EAO for",
                    "value": "Approval",
                }
            ],
            "management_plans": [],
        },
    }

    # Mock the service to return the actual response structure your API returns
    updated_condition_attribute = {
        "independent_attributes": [
            {
                "id": "2754",
                "key": "Submitted to EAO for",
                "value": "Approval",
            }
        ],
        "management_plans": []
    }

    mocker.patch.object(
        ConditionAttributeService,
        "upsert_condition_attribute",
        return_value=updated_condition_attribute,
    )

    rv = client.patch(
        f"/api/attributes/condition/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.OK
    response_json = rv.json

    # Assert the independent attribute value and key
    assert response_json["independent_attributes"][0]["value"] == "Approval"
    assert response_json["independent_attributes"][0]["key"] == "Submitted to EAO for"

    # Assert that management_plans is an empty list
    assert response_json["management_plans"] == []


def test_patch_condition_attribute_validation_error(client, monkeypatch, auth_user):
    """Test patching condition attributes when schema validation fails."""
    condition_id = 123  # arbitrary test condition id

    payload = {
        "requires_management_plan": False,
        "condition_attribute": {
            "independent_attributes": [
                {"id": "1", "key": "Submitted to EAO for", "value": "Approval"}
            ],
            "management_plans": [],
        },
    }

    # Mock the schema load method to raise a ValidationError
    def mock_upsert_condition_attribute(requires_management_plan, condition_id, conditions_attributes_data):
        raise ValidationError("Bad data")

    monkeypatch.setattr(
        ConditionAttributeService,
        "upsert_condition_attribute",
        mock_upsert_condition_attribute
    )

    rv = client.patch(
        f"/api/attributes/condition/{condition_id}",
        json=payload,
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST
    response_json = rv.json

    # Assert the error message is returned
    assert "Bad data" in response_json["message"]


def test_delete_condition_attribute_success(client, mocker, auth_user):
    """Test deleting condition attribute successfully."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(
        project_id=project.project_id, document_type_id=doc_type.id
    )
    condition = factory_condition_model(
        project_id=project.project_id, document_id=document.document_id
    )
    factory_condition_attribute_model(condition_id=condition.id)

    rv = client.delete(
        f"/api/attributes/condition/{condition.id}?requires_management_plan=false",
        headers=auth_user,
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.get_data(as_text=True) == "Condition attribute successfully removed"


def test_delete_condition_attribute_not_found(client, mocker, auth_user):
    """Test deleting condition attribute when nothing is deleted."""
    condition_id = 123

    # Mock delete_condition_attribute to return False (nothing deleted)
    mocker.patch.object(
        ConditionAttributeService,
        "delete_condition_attribute",
        return_value=False
    )

    rv = client.delete(
        f"/api/attributes/condition/{condition_id}?requires_management_plan=false",
        headers=auth_user
    )

    assert rv.status_code == HTTPStatus.OK
    assert rv.get_data(as_text=True) == "No condition attribute data found to remove"


def test_delete_condition_attribute_error(client, mocker, auth_user):
    """Test deleting condition attribute when service raises an error."""
    condition_id = 123

    # Mock delete_condition_attribute to raise a ValueError
    mocker.patch.object(
        ConditionAttributeService,
        "delete_condition_attribute",
        side_effect=ValueError("Something went wrong")
    )

    rv = client.delete(
        f"/api/attributes/condition/{condition_id}?requires_management_plan=false",
        headers=auth_user
    )

    assert rv.status_code == HTTPStatus.BAD_REQUEST
    response_json = rv.json
    assert "Something went wrong" in response_json["message"]
