"""Extraction service — thin wrapper around condition-parser.

All extraction logic lives in condition-parser (gpt.py, document_classifier.py,
extract_management_plans.py, read_pdf.py).  This module imports those directly
so the cron always uses identical extraction quality to the Gradio UI.

The Dockerfile adds /condition-parser to PYTHONPATH so the imports resolve.
"""

import logging
import os

logger = logging.getLogger(__name__)


def extract_and_enrich(file_path: str) -> dict:
    """Full pipeline: classify → extract → enrich.

    Delegates entirely to condition-parser's extract_and_enrich_all().
    Returns a dict with 'conditions' and 'classification' keys.
    """
    # Imported here (not at module level) so Flask has loaded env vars first,
    # which condition-parser reads at module level via os.getenv.
    from gpt import classify_and_count, extract_and_enrich_all
    from extract_first_nations import process_single_pdf

    logger.info('Classifying %s', file_path)
    classification = classify_and_count(file_path)

    logger.info('Extracting and enriching conditions from %s', file_path)
    result = extract_and_enrich_all(file_path, classification)

    if result and 'conditions' in result and file_path.endswith('.pdf'):
        result = process_single_pdf(file_path, result)

    result['classification'] = classification
    logger.info('Extraction complete: %d condition(s)', len(result.get('conditions', [])))
    return result
