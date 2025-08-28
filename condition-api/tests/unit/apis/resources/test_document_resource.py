"""Test Document.

Test for document.
"""
import json
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.models.project import Project
from condition_api.services.document_service import DocumentService
from marshmallow import ValidationError
from tests.utilities.factory_scenarios import TestJwtClaims
from tests.utilities.factory_utils import (
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


def test_get_requires_auth(client):
    """Test endpoints require authentication."""
    response = client.get('/api/documents/type')
    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_get_document_type(client, auth_user):
    """GET /documents/type returns data"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    response = client.get("/api/documents/type", headers=auth_user)
    assert response.status_code == HTTPStatus.OK
    data = response.get_json()

    # Assert that at least one document type is 'Certificate'
    assert any(item['document_type'] == 'Certificate' for item in data)


def test_get_documents_empty(client, monkeypatch, auth_user):
    """GET /documents/project/<project_id> returns empty when no docs exist"""
    project = factory_project_model(project_id=str(uuid.uuid4()))

    # Mock the service
    monkeypatch.setattr(DocumentService, "get_all_documents_by_project_id", lambda pid: [])

    response = client.get(f"/api/documents/project/{project.project_id}", headers=auth_user)
    assert response.status_code == HTTPStatus.OK
    assert response.json == {}


def test_get_documents_with_data(client, auth_user):
    """GET /documents/project/<project_id> returns documents"""
    project = factory_project_model(project_id=str(uuid.uuid4()))

    doc_type = get_seeded_document_type("Certificate")

    # create a document
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    response = client.get(f"/api/documents/project/{project.project_id}", headers=auth_user)
    assert response.status_code == HTTPStatus.OK
    assert response.json[0]["document_id"] == document.document_id
    data = response.get_json()

    # Assert that at least one document has the expected name
    document_ids = [docs["document_id"] for docs in data]
    assert document.document_id in document_ids


def test_get_documents_validation_error(client, auth_user, monkeypatch):
    """Simulate validation error in get_all_documents_by_project_id."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    # Monkeypatch service to raise ValidationError
    def mock_get_all_documents_by_project_id(project_id):
        raise ValidationError("Bad data")

    monkeypatch.setattr(
        DocumentService,
        "get_all_documents_by_project_id",
        mock_get_all_documents_by_project_id
    )

    response = client.get(f"/api/documents/project/{project.project_id}", headers=auth_user)

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "Bad data" in response.get_json()["message"]


def test_post_document(client, auth_header, monkeypatch):
    """POST /documents/project/<project_id> creates a document"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")

    payload = {
        "document_label": "Test Document",
        "document_type_id": 1
    }

    created_document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    monkeypatch.setattr(
        DocumentService,
        "create_document",
        lambda pid, data: created_document
    )

    response = client.post(
        f"/api/documents/project/{project.project_id}",
        data=json.dumps(payload),
        content_type="application/json",
        headers=auth_header
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["document_id"] == created_document.document_id


def test_post_document_validation_error(client, auth_header, monkeypatch):
    """POST /documents/project/<project_id> creates a document"""
    project = factory_project_model(project_id=str(uuid.uuid4()))

    monkeypatch.setattr(Project, "get_by_id", lambda pid: project)

    monkeypatch.setattr(
        "condition_api.resources.document.DocumentSchema.load",
        lambda self, payload: (_ for _ in ()).throw(ValidationError("Invalid payload"))
    )

    response = client.post(
        f"/api/documents/project/{project.project_id}",
        data=json.dumps({"document_label": ""}),
        content_type="application/json",
        headers=auth_header
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert "Invalid payload" in response.json["message"]


def test_get_document_details(client, auth_header):
    """GET /documents/<document_id> returns document details"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    response = client.get(f"/api/documents/{document.document_id}", headers=auth_header)
    assert response.status_code == HTTPStatus.OK
    assert response.json["document_id"] == document.document_id


def test_get_document_details_not_found(client, auth_user, monkeypatch):
    """GET /documents/<document_id> returns empty if document not found"""
    monkeypatch.setattr(DocumentService, "get_document_details", lambda doc_id: None)

    response = client.get(f"/api/documents/{uuid.uuid4()}", headers=auth_user)
    assert response.status_code == HTTPStatus.OK
    assert response.json == {}


def test_patch_document_label(client, auth_header):
    """PATCH /documents/<document_id> updates document label"""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    updated_label = "Updated Document Label"

    response = client.patch(
        f"/api/documents/{document.document_id}",
        data=json.dumps({"document_label": updated_label}),
        content_type="application/json",
        headers=auth_header
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json["document_label"] == updated_label
