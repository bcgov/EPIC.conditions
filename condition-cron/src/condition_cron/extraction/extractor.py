import os
import json
import logging

from condition_cron.extraction import pdf_reader
from condition_cron.extraction.document_classifier import classify_document
from condition_cron.extraction.pdf_reader import read_pdf_page_range, get_page_count
from condition_cron.extraction.management_plans import extract_management_plan_info_from_json

from typing import Any, Dict, List, Optional, Tuple

from condition_cron.extraction.client import get_openai_client

logger = logging.getLogger(__name__)

MODEL = "gpt-4o-2024-05-13"
SCHEMAS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schemas")


# ---------------------------------------------------------------------------
# Schema loading
# ---------------------------------------------------------------------------

def load_schema(schema_name):
    """Load an OpenAI tool schema from the schemas/ directory."""
    schema_path = os.path.join(SCHEMAS_DIR, f"{schema_name}.json")
    with open(schema_path, "r") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# File reading helper
# ---------------------------------------------------------------------------
def _read_file_text(file_path: str) -> str:
    """Read text from a PDF or TXT file path."""
    with open(file_path, "rb") as f:
        if file_path.endswith(".pdf"):
            return pdf_reader.read_pdf(file_path)
        elif file_path.endswith(".txt"):
            return f.read().decode("utf-8", errors="ignore")
        else:
            raise ValueError("Unsupported file type. Only PDF and TXT files are supported.")


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class FinishReasonError(Exception):
    pass

class LengthFinishReasonError(FinishReasonError):
    pass


# ---------------------------------------------------------------------------
# Document classification + count (new entry point, replaces count_conditions)
# ---------------------------------------------------------------------------

def classify_and_count(file_path: str) -> Dict[str, Any]:
    """Classify document structure and estimate condition count.

    Returns a dict with: document_type, has_numbered_conditions,
    section_headers, estimated_item_count.
    """
    file_text = _read_file_text(file_path)
    classification = classify_document(file_text)
    return classification


# ---------------------------------------------------------------------------
# Page-based condition extraction (universal — works for all doc types)
# ---------------------------------------------------------------------------

def extract_conditions_from_pages(file_path: str, classification: Dict[str, Any], pages_per_chunk: int = 5) -> Dict[str, Any]:
    """Extract all conditions from a document using page-based chunking.

    Works for numbered conditions, table formats, and bulleted commitments.
    Returns a dict: {"conditions": [...]}.
    """
    doc_type = classification.get("document_type", "numbered_conditions")
    has_numbered = classification.get("has_numbered_conditions", True)

    # For numbered conditions with a known count, use the legacy chunked approach
    # as it has proven reliable and the validation logic is valuable
    if has_numbered and doc_type == "numbered_conditions":
        estimated_count = classification.get("estimated_item_count", 0)
        if estimated_count > 0:
            return _extract_numbered_conditions(file_path, estimated_count)

    # For all other formats, use page-based extraction
    return _extract_by_pages(file_path, classification, pages_per_chunk)


def _extract_numbered_conditions(file_path: str, number_of_conditions: int, chunk_size: int = 5) -> Dict[str, Any]:
    """Extract numbered conditions using the proven chunk-by-number approach."""
    chunks = []
    for i in range(0, number_of_conditions, chunk_size):
        end = min(i + chunk_size, number_of_conditions)
        logger.info("Extracting conditions %d to %d (of %d)", i + 1, end, number_of_conditions)
        _, chunk = _extract_numbered_range(file_path, i + 1, end)
        logger.debug("Extracted chunk: %s", chunk)
        chunks.append(chunk)

    merged = _merge_json_chunks(chunks)
    merged = json.loads(merged)
    logger.info("Successfully extracted all numbered conditions!")
    return merged


def _extract_numbered_range(file_path: str, starting_condition_number: int, ending_condition_number: int) -> Tuple[Any, str]:
    """Extract a range of numbered conditions with validation and retry logic."""

    def validate_response(response, expected_count):
        finish_reason = response.choices[0].finish_reason
        if finish_reason == "length":
            raise LengthFinishReasonError("Response was cut off due to length of response.")
        elif finish_reason != "stop":
            raise FinishReasonError(f"Unexpected finish reason: {finish_reason}")
        response_json = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
        conditions = response_json.get("conditions", [])
        return len(conditions) == expected_count

    expected_count = ending_condition_number - starting_condition_number + 1
    file_text = _read_file_text(file_path)

    tool_schema = load_schema("condition_schema")
    # Update description for numbered extraction
    tool_schema["function"]["parameters"]["properties"]["conditions"]["description"] = (
        f"Conditions {starting_condition_number} (inclusive) up to and including "
        f"{ending_condition_number} extracted from the document. ALWAYS include the condition name."
    )

    tools = [tool_schema]
    messages = [{"role": "user", "content": (
        f"Here is a document with conditions:\n\n{file_text}\n\n"
        f"Extract conditions {starting_condition_number} to {ending_condition_number}."
    )}]

    client = get_openai_client()
    for attempt in range(3):
        try:
            completion = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools,
                temperature=0.0,
                tool_choice={"type": "function", "function": {"name": tool_schema["function"]["name"]}},
            )

            if validate_response(completion, expected_count):
                logger.info("Successfully extracted conditions %d to %d!", starting_condition_number, ending_condition_number)
                return completion, completion.choices[0].message.tool_calls[0].function.arguments

            logger.error("Validation failed. Payload: %s", completion.choices[0].message.tool_calls[0].function.arguments)
            logger.warning("Attempt %d: Validation failed. Retrying...", attempt + 1)

        except LengthFinishReasonError as e:
            logger.error("Exceeded GPT API response length: %s", e)
            mid = (starting_condition_number + ending_condition_number) // 2
            logger.info("Splitting... %d to %d", starting_condition_number, mid)
            _, first_half = _extract_numbered_range(file_path, starting_condition_number, mid)
            logger.info("Splitting... %d to %d", mid + 1, ending_condition_number)
            _, second_half = _extract_numbered_range(file_path, mid + 1, ending_condition_number)
            merged = _merge_json_chunks([first_half, second_half])
            return None, merged

        except Exception as e:
            logger.error("Exception in _extract_numbered_range: %s", e, exc_info=True)

    return None, "Failed to extract the correct number of conditions after multiple attempts"


def _extract_by_pages(file_path: str, classification: Dict[str, Any], pages_per_chunk: int = 5) -> Dict[str, Any]:
    """Extract conditions/commitments using page-based chunking (for non-numbered docs)."""
    doc_type = classification.get("document_type", "bulleted_commitments")
    section_headers = classification.get("section_headers", [])

    if file_path.endswith(".pdf"):
        total_pages = get_page_count(file_path)
    else:
        # For text files, treat as single page
        total_pages = 1

    tool_schema = load_schema("condition_schema")
    all_conditions = []
    condition_offset = 1

    client = get_openai_client()
    for start_page in range(1, total_pages + 1, pages_per_chunk):
        end_page = min(start_page + pages_per_chunk - 1, total_pages)
        logger.info("Extracting from pages %d-%d (of %d)", start_page, end_page, total_pages)

        if file_path.endswith(".pdf"):
            page_text = read_pdf_page_range(file_path, start_page, end_page)
        else:
            page_text = _read_file_text(file_path)

        if not page_text.strip():
            continue

        # Build prompt based on document type
        if doc_type == "table_format":
            prompt = (
                f"Here is a section of an environmental assessment document (pages {start_page}-{end_page}). "
                f"The document contains conditions/commitments organized in a table format.\n\n"
                f"{page_text}\n\n"
                f"Extract every discrete condition, commitment, or requirement from this section. "
                f"Each row or distinct commitment in the table should be a separate condition. "
                f"Assign sequential condition numbers starting from {condition_offset}. "
                f"Use the table's category/component column as the condition_name."
            )
        elif doc_type == "bulleted_commitments":
            section_info = ""
            if section_headers:
                section_info = f"Known section headers in this document: {', '.join(section_headers)}. "
            prompt = (
                f"Here is a section of an environmental assessment document (pages {start_page}-{end_page}). "
                f"The document contains commitments organized as bullet points under topic headings. "
                f"{section_info}\n\n"
                f"{page_text}\n\n"
                f"Extract conditions/commitments from this section. "
                f"IMPORTANT: Each topic heading (e.g., 'Policies', 'Worker Orientation Training', 'Environmental Management') "
                f"represents ONE condition. ALL bullet points and sub-bullets under the same topic heading "
                f"must be combined into a SINGLE condition's condition_text. Do NOT split bullet points "
                f"under the same heading into separate conditions. "
                f"Only create a new condition when you encounter a new topic heading. "
                f"Assign sequential condition numbers starting from {condition_offset}. "
                f"Use the topic heading as the condition_name."
            )
        else:  # mixed or fallback
            prompt = (
                f"Here is a section of an environmental assessment document (pages {start_page}-{end_page}).\n\n"
                f"{page_text}\n\n"
                f"Extract every discrete condition, commitment, or requirement from this section. "
                f"If conditions are numbered, use the document's numbering. "
                f"If they are not numbered, assign sequential numbers starting from {condition_offset}. "
                f"Use the section/topic header as the condition_name where applicable. "
                f"IMPORTANT: When multiple bullet points or sub-items appear under the same heading or condition, "
                f"they are part of ONE condition — combine them all into a single condition_text. "
                f"Do NOT split bullet points under the same heading into separate conditions."
            )

        tools = [tool_schema]
        messages = [{"role": "user", "content": prompt}]

        try:
            completion = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools,
                temperature=0.0,
                tool_choice={"type": "function", "function": {"name": tool_schema["function"]["name"]}},
            )

            finish_reason = completion.choices[0].finish_reason
            if finish_reason == "length":
                logger.warning("Response cut off on pages %d-%d, retrying with smaller chunks", start_page, end_page)
                # Retry with half the pages
                if pages_per_chunk > 1:
                    half = max(1, pages_per_chunk // 2)
                    sub_result = _extract_by_pages(file_path, classification, half)
                    return sub_result
                else:
                    logger.error("Single page too long, extracting what we can")

            result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)
            page_conditions = result.get("conditions", [])

            # Reassign sequential numbers to avoid gaps/overlaps
            for cond in page_conditions:
                cond["condition_number"] = condition_offset
                condition_offset += 1

            all_conditions.extend(page_conditions)
            logger.info("Extracted %d conditions from pages %d-%d", len(page_conditions), start_page, end_page)

        except Exception as e:
            logger.error("Error extracting pages %d-%d: %s", start_page, end_page, e, exc_info=True)

    # Deduplicate conditions that may span page boundaries
    all_conditions = _deduplicate_conditions(all_conditions)

    # Re-number sequentially after dedup
    for i, cond in enumerate(all_conditions, start=1):
        cond["condition_number"] = i

    logger.info("Successfully extracted %d conditions!", len(all_conditions))
    return {"conditions": all_conditions}


def _deduplicate_conditions(conditions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate conditions that may appear when items span page boundaries."""
    if len(conditions) <= 1:
        return conditions

    deduped = [conditions[0]]
    for cond in conditions[1:]:
        prev_text = deduped[-1].get("condition_text", "").strip()
        curr_text = cond.get("condition_text", "").strip()

        # Check if this condition is substantially similar to the previous one
        if prev_text and curr_text:
            # If current text starts with or is contained in previous, skip it
            shorter = min(len(prev_text), len(curr_text))
            overlap_threshold = int(shorter * 0.7)
            if overlap_threshold > 50:
                if prev_text[:overlap_threshold] == curr_text[:overlap_threshold]:
                    # Keep the longer version
                    if len(curr_text) > len(prev_text):
                        deduped[-1] = cond
                    continue

        deduped.append(cond)

    return deduped


# ---------------------------------------------------------------------------
# Combined enrichment (replaces separate subcondition + management plan passes)
# ---------------------------------------------------------------------------

def enrich_condition(condition_text: str, condition_name: Optional[str] = None) -> Dict[str, Any]:
    """Extract clauses, deliverables, and report submissions from a single condition.

    Returns a dict with: clauses, deliverables, report_submissions.
    """
    enrichment_schema = load_schema("enrichment_schema")

    full_text = ""
    if condition_name:
        full_text = f"{condition_name}\n\n"
    full_text += condition_text

    prompt = (
        "Here is a condition from an environmental assessment document:\n\n"
        f"{full_text}\n\n"
        "Extract the following from this condition:\n"
        "1. Break it down into clauses and subconditions (nested structure with identifiers like 1.1, a), i., etc.)\n"
        "2. Identify any deliverables — management plans, reports, proposals, or other documents that must be written/submitted\n"
        "3. Identify any periodic report submission requirements (separate from one-time deliverables)\n"
        "If any category has no items, return an empty array for that category."
    )

    messages = [{"role": "user", "content": prompt}]
    tools = [enrichment_schema]

    client = get_openai_client()
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            temperature=0.0,
            tool_choice={"type": "function", "function": {"name": enrichment_schema["function"]["name"]}},
        )

        result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)
        return result

    except Exception as e:
        logger.error("Enrichment error: %s", e, exc_info=True)
        return {"clauses": [], "deliverables": [], "report_submissions": []}


def enrich_all_conditions(input_json: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich all conditions with clauses, deliverables, and report submissions.

    Modifies input_json in place and returns it.
    """
    for condition in input_json.get("conditions", []):
        cond_num = condition.get("condition_number", "?")
        logger.info("Enriching condition %s...", cond_num)

        condition_text = condition.get("condition_text", "")
        condition_name = condition.get("condition_name")

        enrichment = enrich_condition(condition_text, condition_name)

        condition["clauses"] = enrichment.get("clauses", [])
        condition["deliverables"] = enrichment.get("deliverables", [])
        condition["report_submissions"] = enrichment.get("report_submissions", [])

        # Log what was found
        n_clauses = len(condition["clauses"])
        n_deliverables = len(condition["deliverables"])
        n_reports = len(condition["report_submissions"])
        logger.debug("Condition %s: %d clauses, %d deliverables, %d report submissions", cond_num, n_clauses, n_deliverables, n_reports)

    return input_json


# ---------------------------------------------------------------------------
# Main orchestrator (new end-to-end pipeline)
# ---------------------------------------------------------------------------

def extract_and_enrich_all(file_path: str, classification: Dict[str, Any]) -> Dict[str, Any]:
    """Full extraction pipeline: extract conditions, enrich each one.

    Args:
        file_path: file path string
        classification: dict from classify_and_count()

    Returns:
        dict: Complete JSON with conditions, clauses, deliverables, report_submissions
    """
    # Step 1: Extract all conditions
    logger.info("=== STEP 1: Extracting conditions ===")
    result = extract_conditions_from_pages(file_path, classification)

    # Step 2: Enrich each condition (clauses + report_submissions)
    logger.info("=== STEP 2: Enriching conditions (clauses & report submissions) ===")
    result = enrich_all_conditions(result)

    # Step 3: Extract deliverables using dedicated management plan extraction
    logger.info("=== STEP 3: Extracting deliverables ===")
    result = extract_management_plan_info_from_json(result)

    logger.info("=== Extraction complete: %d conditions ===", len(result.get('conditions', [])))
    return result


# ---------------------------------------------------------------------------
# Merge utility
# ---------------------------------------------------------------------------

def _merge_json_chunks(chunks: List[Any]) -> str:
    """Merge multiple JSON chunk strings into one."""
    merged = {"conditions": []}
    for chunk in chunks:
        if isinstance(chunk, str):
            chunk_json = json.loads(chunk)
        else:
            chunk_json = chunk
        merged["conditions"].extend(chunk_json.get("conditions", []))
    return json.dumps(merged)
