"""Tests for document eligibility classification helpers."""

import json
from types import SimpleNamespace

from condition_cron.extraction.document_classifier import (
    classify_document_eligibility,
    is_document_supported_for_extraction,
)


def test_classify_document_eligibility_rejects_empty_text():
    """Blank/scanned text should stop before extraction."""
    result = classify_document_eligibility("")

    assert result["is_supported_document"] is False
    assert result["document_family"] == "unsupported"
    assert result["unsupported_category"] == "unreadable_format"
    assert result["confidence"] == 1.0


def test_is_document_supported_for_extraction_blocks_high_confidence_unsupported():
    """A confident unsupported result should block extraction."""
    eligibility = {
        "is_supported_document": False,
        "document_family": "unsupported",
        "unsupported_category": "invalid_document",
        "confidence": 0.9,
        "reason": "Rental application.",
        "evidence": ["rental application", "tenant"],
    }

    assert is_document_supported_for_extraction(eligibility, 0.75) is False


def test_is_document_supported_for_extraction_allows_uncertain_unsupported():
    """Low-confidence unsupported results should continue extraction."""
    eligibility = {
        "is_supported_document": False,
        "document_family": "unsupported",
        "unsupported_category": "invalid_document",
        "confidence": 0.5,
        "reason": "Not enough evidence.",
        "evidence": [],
    }

    assert is_document_supported_for_extraction(eligibility, 0.75) is True


def test_is_document_supported_for_extraction_blocks_amendment_family():
    """Amendments are known unsupported even though they are EAO documents."""
    eligibility = {
        "is_supported_document": True,
        "document_family": "amendment",
        "unsupported_category": "amendment_document",
        "confidence": 0.9,
        "reason": "This is an amendment document.",
        "evidence": ["Amendment to Environmental Assessment Certificate"],
    }

    assert is_document_supported_for_extraction(eligibility, 0.75) is False


def test_classify_document_eligibility_normalizes_amendment_as_unsupported(monkeypatch):
    """The model cannot accidentally pass amendments by setting supported=true."""
    arguments = {
        "is_supported_document": True,
        "document_family": "amendment",
        "unsupported_category": "invalid_document",
        "confidence": 0.9,
        "reason": "This is an amendment to an environmental assessment certificate.",
        "evidence": ["Amendment to Environmental Assessment Certificate"],
    }

    class _FakeCompletions:
        def create(self, **kwargs):  # noqa: ARG002
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            tool_calls=[
                                SimpleNamespace(
                                    function=SimpleNamespace(
                                        arguments=json.dumps(arguments)
                                    )
                                )
                            ]
                        )
                    )
                ]
            )

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=_FakeCompletions())
    )
    monkeypatch.setattr(
        "condition_cron.extraction.document_classifier.get_openai_client",
        lambda: fake_client,
    )

    result = classify_document_eligibility(
        "Amendment to Environmental Assessment Certificate #M24-01"
    )

    assert result["is_supported_document"] is False
    assert result["document_family"] == "amendment"
    assert result["unsupported_category"] == "amendment_document"
    assert result["confidence"] == 0.9


def test_classify_document_eligibility_assigns_default_invalid_category(monkeypatch):
    """Unsupported non-amendment documents default to the invalid document category."""
    arguments = {
        "is_supported_document": False,
        "document_family": "unsupported",
        "confidence": 0.95,
        "reason": "This appears to be a rental application.",
        "evidence": ["rental application", "tenant"],
    }

    class _FakeCompletions:
        def create(self, **kwargs):  # noqa: ARG002
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            tool_calls=[
                                SimpleNamespace(
                                    function=SimpleNamespace(
                                        arguments=json.dumps(arguments)
                                    )
                                )
                            ]
                        )
                    )
                ]
            )

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=_FakeCompletions())
    )
    monkeypatch.setattr(
        "condition_cron.extraction.document_classifier.get_openai_client",
        lambda: fake_client,
    )

    result = classify_document_eligibility("Rental application tenant landlord")

    assert result["is_supported_document"] is False
    assert result["unsupported_category"] == "invalid_document"
