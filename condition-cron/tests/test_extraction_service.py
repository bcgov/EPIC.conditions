"""Tests for extraction service eligibility gating."""

import pytest

from condition_cron.services import extraction_service


def _unsupported_eligibility(confidence: float) -> dict:
    return {
        "is_supported_document": False,
        "document_family": "unsupported",
        "confidence": confidence,
        "reason": "This appears to be a rental application.",
        "evidence": ["rental application", "tenant", "landlord"],
    }


def test_extract_and_enrich_blocks_high_confidence_unsupported(monkeypatch, tmp_path):
    """Confident unrelated documents should not reach extraction."""
    document = tmp_path / "rental.txt"
    document.write_text("Rental application tenant landlord monthly rent.", encoding="utf-8")

    monkeypatch.setattr(
        "condition_cron.extraction.document_classifier.classify_document_eligibility",
        lambda file_text: _unsupported_eligibility(0.9),
    )
    monkeypatch.setattr(
        "condition_cron.services.extraction_service._get_unsupported_confidence_threshold",
        lambda: 0.75,
    )

    def fail_if_called(*args, **kwargs):  # noqa: ARG001
        raise AssertionError("Extraction should not run for unsupported documents")

    monkeypatch.setattr("condition_cron.extraction.extractor.classify_and_count", fail_if_called)
    monkeypatch.setattr("condition_cron.extraction.extractor.extract_and_enrich_all", fail_if_called)

    with pytest.raises(extraction_service.UnsupportedDocumentError) as exc:
        extraction_service.extract_and_enrich(str(document))

    assert exc.value.eligibility["confidence"] == 0.9


def test_extract_and_enrich_allows_low_confidence_unsupported(monkeypatch, tmp_path):
    """Uncertain documents should continue through the existing extraction path."""
    document = tmp_path / "maybe-conditions.txt"
    document.write_text("Some numbered commitments with limited context.", encoding="utf-8")

    classification = {
        "document_type": "numbered_conditions",
        "has_numbered_conditions": True,
        "section_headers": [],
        "estimated_item_count": 0,
    }

    monkeypatch.setattr(
        "condition_cron.extraction.document_classifier.classify_document_eligibility",
        lambda file_text: _unsupported_eligibility(0.5),
    )
    monkeypatch.setattr(
        "condition_cron.services.extraction_service._get_unsupported_confidence_threshold",
        lambda: 0.75,
    )
    monkeypatch.setattr(
        "condition_cron.extraction.extractor.classify_and_count",
        lambda path, file_text=None: classification,
    )
    monkeypatch.setattr(
        "condition_cron.extraction.extractor.extract_and_enrich_all",
        lambda path, extracted_classification: {"conditions": []},
    )

    result = extraction_service.extract_and_enrich(str(document))

    assert result["classification"] == classification
    assert result["eligibility"]["confidence"] == 0.5
