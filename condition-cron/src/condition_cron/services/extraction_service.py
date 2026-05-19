"""Extraction service — thin wrapper around the cron extraction package.

All runtime extraction logic lives under condition_cron.extraction so this
service can run without the old Gradio/manual condition-parser module.
"""

import logging
import os

from flask import current_app

logger = logging.getLogger(__name__)


class UnsupportedDocumentError(Exception):
    """Raised when a document is confidently unrelated to EAO conditions."""

    def __init__(self, eligibility: dict):
        self.eligibility = eligibility
        reason = eligibility.get(
            "reason",
            "This document does not appear to be a supported EAO conditions document.",
        )
        super().__init__(reason)


def _get_unsupported_confidence_threshold() -> float:
    """Return the configured threshold for blocking unsupported documents."""
    try:
        configured_value = current_app.config.get(
            "EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD",
            os.getenv("EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD", "0.75"),
        )
    except RuntimeError:
        configured_value = os.getenv("EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD", "0.75")

    try:
        return float(configured_value)
    except (TypeError, ValueError):
        logger.warning(
            "Invalid EXTRACTION_UNSUPPORTED_CONFIDENCE_THRESHOLD=%r; using 0.75",
            configured_value,
        )
        return 0.75


def extract_and_enrich(file_path: str) -> dict:
    """Full pipeline: classify → extract → enrich.

    Delegates to condition_cron.extraction.extractor.extract_and_enrich_all().
    Returns a dict with 'conditions' and 'classification' keys.
    """
    # Imported here so Flask has loaded env vars before the OpenAI client is built.
    from condition_cron.extraction.document_classifier import (
        classify_document_eligibility,
        is_document_supported_for_extraction,
    )
    from condition_cron.extraction.extractor import (
        classify_and_count,
        extract_and_enrich_all,
        read_file_text,
    )
    from condition_cron.extraction.first_nations import process_single_pdf

    file_text = read_file_text(file_path)
    eligibility = classify_document_eligibility(file_text)
    threshold = _get_unsupported_confidence_threshold()

    if not is_document_supported_for_extraction(eligibility, threshold):
        logger.info(
            "Skipping unsupported document %s: %s",
            file_path,
            eligibility.get("reason"),
        )
        raise UnsupportedDocumentError(eligibility)

    logger.info('Classifying %s', file_path)
    classification = classify_and_count(file_path, file_text=file_text)

    logger.info('Extracting and enriching conditions from %s', file_path)
    result = extract_and_enrich_all(file_path, classification)

    if result and 'conditions' in result and file_path.endswith('.pdf'):
        result = process_single_pdf(file_path, result)

    result['eligibility'] = eligibility
    result['classification'] = classification
    logger.info('Extraction complete: %d condition(s)', len(result.get('conditions', [])))
    return result
