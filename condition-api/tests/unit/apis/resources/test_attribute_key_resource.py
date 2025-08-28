"""Test Attribute Keys.

Test for attribute keys.
"""
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.services.attribute_key_service import AttributeKeyService
from marshmallow import ValidationError
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


def test_get_attribute_keys_success(client, auth_user):
    """Test successful fetch of attribute keys."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)

    response = client.get(
        f"/api/attributekeys/condition/{condition.id}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    assert isinstance(data, list)


def test_get_attribute_keys_validation_error(client, auth_user, monkeypatch):
    """Test handling of ValidationError."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)
    condition_id = condition.id
    factory_management_plan_model(condition_id)

    # Monkeypatch service to raise ValidationError
    def mock_get_attributes(condition_id, management_plan_id):
        raise ValidationError("Bad data")

    monkeypatch.setattr(
        AttributeKeyService,
        "get_all_attributes",
        mock_get_attributes
    )

    response = client.get(
        f"/api/attributekeys/condition/{condition_id}",
        headers=auth_user
    )
    assert response.status_code == HTTPStatus.BAD_REQUEST
