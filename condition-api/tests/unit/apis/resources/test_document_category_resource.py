"""Test Document Category.

Test for document category.
"""
import uuid
import pytest
from http import HTTPStatus

from condition_api import get_named_config
from condition_api.services.document_service import DocumentService
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


def test_get_documents_by_category_success(client, auth_user):
    """Test fetching documents by project and category successfully."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    response = client.get(
        f"/api/document-category/project/{project.project_id}/category/{doc_type.id}",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.OK
    data = response.get_json()
    assert isinstance(data, dict)
    assert "documents" in data
    assert isinstance(data["documents"], list)
    assert data["document_category"] == "Certificate and Amendments"
    assert data["project_name"] == project.project_name


def test_get_documents_by_category_not_found(client, auth_user, monkeypatch):
    """Test fetching documents when none exist for the category."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    category_id = 999  # Nonexistent category

    # Monkeypatch the service to return empty list
    monkeypatch.setattr(
        DocumentService,
        "get_all_documents_by_category",
        lambda pid, cid: []
    )

    response = client.get(
        f"/api/document-category/project/{project.project_id}/category/{category_id}",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.NOT_FOUND
    data = response.get_json()
    assert "No documents found" in data["message"]


def test_get_documents_by_category_validation_error(client, auth_user, monkeypatch):
    """Test fetching documents when the service raises a ValidationError."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    category_id = 1

    from marshmallow import ValidationError

    def raise_validation_error(pid, cid):
        raise ValidationError("Invalid request")

    monkeypatch.setattr(
        DocumentService,
        "get_all_documents_by_category",
        raise_validation_error
    )

    response = client.get(
        f"/api/document-category/project/{project.project_id}/category/{category_id}",
        headers=auth_user
    )

    assert response.status_code == HTTPStatus.BAD_REQUEST
    data = response.get_json()
    assert "Invalid request" in data["message"]
