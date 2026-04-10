"""Tests for document processing orchestration."""

from condition_cron.tasks.process_documents import ProcessDocuments


def test_process_skips_save_when_request_was_rejected(monkeypatch, tmp_path):
    """A request rejected mid-process should not be overwritten as completed."""
    downloaded = tmp_path / "document.pdf"
    downloaded.write_text("pdf")
    calls = {"saved": False, "failed": False}

    monkeypatch.setattr(
        "condition_cron.tasks.process_documents.db_service.get_pending_requests",
        lambda: [{
            "id": 1,
            "s3_url": "condition_documents/document.pdf",
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
