from http import HTTPStatus
from tests.utilities.factory_utils import (
    factory_project_model,
    factory_document_model,
    factory_condition_model,
    factory_amendment_model,
    get_seeded_document_category,
    get_seeded_document_type,
)


def test_get_all_projects_endpoint(client, session, auth_header):
    """Test GET /projects returns valid project document structure."""
    # Create entities
    project = factory_project_model(project_id="58851056aaecd9001b80ebf8")
    category = get_seeded_document_category("Certificate and Amendments")
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project, doc_type)

    # Pass both document_id and project_id to avoid IntegrityError
    factory_condition_model(document.document_id, project.project_id)

    factory_amendment_model(document)

    # Call endpoint
    response = client.get("/api/projects", headers=auth_header)

    assert response.status_code == HTTPStatus.OK
    projects = response.json

    assert isinstance(projects, list)
    assert any(p["project_id"] == "58851056aaecd9001b80ebf8" for p in projects)

    matching = next((p for p in projects if p["project_id"] == "58851056aaecd9001b80ebf8"), None)
    assert matching is not None
    assert matching["project_name"] == "Tulsequah Chief Mine"
    assert "documents" in matching
    assert len(matching["documents"]) == 1

    doc_info = matching["documents"][0]
    assert doc_info["document_category"] == category.category_name
    assert "Certificate" in doc_info["document_types"]
    assert doc_info["is_latest_amendment_added"] is True
    assert doc_info["amendment_count"] >= 1
