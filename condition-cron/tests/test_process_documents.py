"""Tests for document processing orchestration."""

from condition_cron.tasks.process_documents import ProcessDocuments
from condition_cron.services import extraction_service


def test_process_skips_save_when_request_was_rejected(monkeypatch, tmp_path):
    """A request rejected mid-process should not be overwritten as completed."""
    downloaded = tmp_path / "document.pdf"
    downloaded.write_text("pdf")
    calls = {"saved": False, "failed": False}

    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.get_pending_requests",
        lambda: [{
            "id": 1,
            "s3_url": "condition_extraction_documents/document.pdf",
            "project_id": "project-1",
            "document_id": "document-1",
            "project_name": "Project 1",
            "project_type": "Mines",
            "document_label": "Document 1",
            "document_file_name": "document.pdf",
            "document_type": "Certificate",
            "date_issued": None,
            "act": None,
        }],
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.mark_processing",
        lambda request_id: None,
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.s3_service.download_file",
        lambda s3_key: str(downloaded),
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.extraction_service.extract_and_enrich",
        lambda path: {"conditions": []},
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.get_request_status",
        lambda request_id: "rejected",
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.save_extraction_result",
        lambda request_id, extracted_data: calls.update(saved=True),
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.mark_failed",
        lambda request_id, error_message: calls.update(failed=True),
    )

    ProcessDocuments.process()

    assert calls == {"saved": False, "failed": False}


def test_process_marks_unsupported_documents(monkeypatch, tmp_path):
    """Unsupported documents should get a clear status instead of a generic failure."""
    downloaded = tmp_path / "rental.pdf"
    downloaded.write_text("pdf")
    eligibility = {
        "is_supported_document": False,
        "document_family": "unsupported",
        "unsupported_category": "invalid_document",
        "confidence": 0.9,
        "reason": "This appears to be a rental application.",
        "evidence": ["rental application", "tenant"],
    }
    calls = {"saved": False, "failed": False, "unsupported": False}

    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.get_pending_requests",
        lambda: [{
            "id": 2,
            "s3_url": "condition_extraction_documents/rental.pdf",
            "project_id": "project-1",
            "document_id": "document-1",
            "project_name": "Project 1",
            "project_type": "Mines",
            "document_label": "Rental Application",
            "document_file_name": "rental.pdf",
            "document_type": "Certificate",
            "date_issued": None,
            "act": None,
        }],
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.mark_processing",
        lambda request_id: None,
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.s3_service.download_file",
        lambda s3_key: str(downloaded),
    )

    def raise_unsupported(path):  # noqa: ARG001
        raise extraction_service.UnsupportedDocumentError(eligibility)

    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.extraction_service.extract_and_enrich",
        raise_unsupported,
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.get_request_status",
        lambda request_id: "processing",
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.mark_unsupported",
        lambda request_id, reason, extracted_eligibility: calls.update(
            unsupported=True,
            reason=reason,
            eligibility=extracted_eligibility,
        ),
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.save_extraction_result",
        lambda request_id, extracted_data: calls.update(saved=True),
    )
    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.mark_failed",
        lambda request_id, error_message: calls.update(failed=True),
    )

    ProcessDocuments.process()

    assert calls["unsupported"] is True
    assert calls["eligibility"] == eligibility
    assert calls["saved"] is False
    assert calls["failed"] is False
