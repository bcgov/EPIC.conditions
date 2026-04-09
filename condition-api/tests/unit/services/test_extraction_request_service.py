"""Tests for extraction request service behavior."""

import uuid

from condition_api.models import ExtractionRequest, db
from condition_api.services.extraction_request_service import ExtractionRequestService
from tests.utilities.factory_utils import (
    factory_document_model,
    factory_project_model,
    get_seeded_document_type,
)


def test_reject_request_soft_rejects_and_clears_extracted_data():
    """Rejecting preserves the request for archive display but drops raw JSON."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    request = ExtractionRequest(
        project_id=project.project_id,
        document_id=document.document_id,
        document_type_id=doc_type.id,
        document_label=document.document_label,
        s3_url="condition_documents/test.pdf",
        status="completed",
        extracted_data={"conditions": [{"condition_number": 1}]},
    )
    db.session.add(request)
    db.session.commit()

    result = ExtractionRequestService.reject_request(request.id)

    assert result.status == "rejected"
    assert result.extracted_data is None

    persisted = db.session.query(ExtractionRequest).filter_by(id=request.id).one()
    assert persisted.status == "rejected"
    assert persisted.extracted_data is None
