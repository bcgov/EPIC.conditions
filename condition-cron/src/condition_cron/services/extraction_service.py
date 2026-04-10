"""Extraction service — thin wrapper around the cron extraction package.

All runtime extraction logic lives under condition_cron.extraction so this
service can run without the old Gradio/manual condition-parser module.
"""

import logging
import os

logger = logging.getLogger(__name__)


def extract_and_enrich(file_path: str) -> dict:
    """Full pipeline: classify → extract → enrich.

    Delegates to condition_cron.extraction.extractor.extract_and_enrich_all().
    Returns a dict with 'conditions' and 'classification' keys.
    """
    # Imported here so Flask has loaded env vars before the OpenAI client is built.
    from condition_cron.extraction.extractor import classify_and_count, extract_and_enrich_all
    from condition_cron.extraction.first_nations import process_single_pdf

    logger.info('Classifying %s', file_path)
    classification = classify_and_count(file_path)

    logger.info('Extracting and enriching conditions from %s', file_path)
    result = extract_and_enrich_all(file_path, classification)

    if result and 'conditions' in result and file_path.endswith('.pdf'):
        result = process_single_pdf(file_path, result)

    result['classification'] = classification
    logger.info('Extraction complete: %d condition(s)', len(result.get('conditions', [])))
    return result
