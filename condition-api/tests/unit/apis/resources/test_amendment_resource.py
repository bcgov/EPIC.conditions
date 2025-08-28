"""Test Amendment.

Test for amendment.
"""
import json
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.models.document import Document
from condition_api.schemas.amendment import AmendmentSchema
from condition_api.services.amendment_service import AmendmentService
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
    factory_amendment_model,
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


def test_post_amendment_success(client, auth_header, monkeypatch):
    """Test creating a amendment successfully."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    created_amendment = factory_amendment_model(document)

    monkeypatch.setattr(
        AmendmentService,
        "create_amendment",
        lambda document_id, data: {"amendment_id": created_amendment.id, **data}
    )

    payload = {
        "amendment_name": "Test Amendment",
        "date_issued": "2025-08-08",
        "is_latest_amendment_added": True
    }

    response = client.post(
        f"/api/amendments/document/{document.id}",
        data=json.dumps(payload),
        content_type="application/json",
        headers=auth_header,
    )

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert data["amendment_name"] == "Test Amendment"


def test_post_amendment_document_not_found(client, auth_header):
    """Test amendment creation when document does not exist."""
    payload = {
        "amendment_name": "Test Amendment",
        "date_issued": "2025-08-08",
        "is_latest_amendment_added": True
    }

    response = client.post(
        "/api/amendments/document/999",
        data=json.dumps(payload),
        content_type="application/json",
        headers=auth_header,
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.get_json()["message"] == "No document found"


def test_post_amendment_validation_error(client, auth_header, monkeypatch):
    """Test amendment creation when schema validation fails."""
    monkeypatch.setattr(Document, "get_by_id", lambda _id: {"id": _id})

    # Force schema validation error
    def raise_validation(self, data):
        from marshmallow import ValidationError
        raise ValidationError("Invalid data")

    payload = {
        "amendment_name": "Test Amendment",
        "date_issued": "2025-08-08",
        "is_latest_amendment_added": True
    }

    monkeypatch.setattr(AmendmentSchema, "load", raise_validation)

    response = client.post(
        "/api/amendments/document/999",
        data=json.dumps(payload),
        content_type="application/json",
        headers=auth_header,
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "Invalid data" in response.get_json()["message"]
