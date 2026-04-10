import os
import json
import logging

from openai import OpenAI
from condition_cron.extraction import pdf_reader
from condition_cron.extraction.document_classifier import classify_document
from condition_cron.extraction.pdf_reader import read_pdf_page_range, get_page_count
from condition_cron.extraction.management_plans import extract_management_plan_info_from_json


logger = logging.getLogger(__name__)


class _NoColor:
    BLACK = RED = GREEN = YELLOW = BLUE = MAGENTA = CYAN = WHITE = RESET = ""


Fore = _NoColor()

client = OpenAI(
    api_key=os.getenv("EXTRACTOR_API_KEY") or os.getenv("OPENAI_API_KEY") or "not-set",
    base_url=f"{os.getenv('EXTRACTOR_API_URL', '').rstrip('/')}/v1" if os.getenv("EXTRACTOR_API_URL") else None,
)

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

def _read_file_text(file_input):
    """Read text from a PDF or TXT file input (Gradio file object)."""
    file_path = file_input.name if hasattr(file_input, "name") else file_input
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

def classify_and_count(file_input):
    """Classify document structure and estimate condition count.

    Returns a dict with: document_type, has_numbered_conditions,
    section_headers, estimated_item_count.
    """
    file_text = _read_file_text(file_input)
    classification = classify_document(file_text)
    return classification


# ---------------------------------------------------------------------------
# Page-based condition extraction (universal — works for all doc types)
# ---------------------------------------------------------------------------

def extract_conditions_from_pages(file_input, classification, pages_per_chunk=5):
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
            return _extract_numbered_conditions(file_input, estimated_count)

    # For all other formats, use page-based extraction
    return _extract_by_pages(file_input, classification, pages_per_chunk)


def _extract_numbered_conditions(file_input, number_of_conditions, chunk_size=5):
    """Extract numbered conditions using the proven chunk-by-number approach."""
    chunks = []
    for i in range(0, number_of_conditions, chunk_size):
        end = min(i + chunk_size, number_of_conditions)
        print(Fore.YELLOW + f"\nExtracting conditions {i + 1} to {end} (of {number_of_conditions})\n" + Fore.RESET)
        _, chunk = _extract_numbered_range(file_input, i + 1, end)
        print(Fore.GREEN + chunk + Fore.RESET)
        chunks.append(chunk)

    merged = _merge_json_chunks(chunks)
    merged = json.loads(merged)
    print(Fore.GREEN + "\nSuccessfully extracted all numbered conditions!" + Fore.RESET)
    return merged


def _extract_numbered_range(file_input, starting_condition_number, ending_condition_number):
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
    file_text = _read_file_text(file_input)

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
                print(Fore.GREEN + f"Successfully extracted conditions {starting_condition_number} to {ending_condition_number}!" + Fore.RESET)
                return completion, completion.choices[0].message.tool_calls[0].function.arguments

            print(Fore.RED + completion.choices[0].message.tool_calls[0].function.arguments + Fore.RESET)
            print(Fore.RED + f"\nAttempt {attempt + 1}: Validation failed. Retrying...\n" + Fore.RESET)

        except LengthFinishReasonError as e:
            print(Fore.RED + f"Exceeded GPT API response length: {e}" + Fore.RESET)
            mid = (starting_condition_number + ending_condition_number) // 2
            print(Fore.YELLOW + f"Splitting... {starting_condition_number} to {mid}" + Fore.RESET)
            _, first_half = _extract_numbered_range(file_input, starting_condition_number, mid)
            print(Fore.YELLOW + f"Splitting... {mid + 1} to {ending_condition_number}" + Fore.RESET)
            _, second_half = _extract_numbered_range(file_input, mid + 1, ending_condition_number)
            merged = _merge_json_chunks([first_half, second_half])
            return None, merged

        except Exception as e:
            print(Fore.RED + f"Exception: {e}" + Fore.RESET)

    return None, "Failed to extract the correct number of conditions after multiple attempts"


def _extract_by_pages(file_input, classification, pages_per_chunk=5):
    """Extract conditions/commitments using page-based chunking (for non-numbered docs)."""
    file_path = file_input.name if hasattr(file_input, "name") else file_input
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

    for start_page in range(1, total_pages + 1, pages_per_chunk):
        end_page = min(start_page + pages_per_chunk - 1, total_pages)
        print(Fore.YELLOW + f"\nExtracting from pages {start_page}-{end_page} (of {total_pages})\n" + Fore.RESET)

        if file_path.endswith(".pdf"):
            page_text = read_pdf_page_range(file_path, start_page, end_page)
        else:
            page_text = _read_file_text(file_input)

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
                print(Fore.RED + f"Response cut off on pages {start_page}-{end_page}, retrying with smaller chunks" + Fore.RESET)
                # Retry with half the pages
                if pages_per_chunk > 1:
                    half = max(1, pages_per_chunk // 2)
                    sub_result = _extract_by_pages(file_input, classification, half)
                    return sub_result
                else:
                    print(Fore.RED + "Single page too long, extracting what we can" + Fore.RESET)

            result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)
            page_conditions = result.get("conditions", [])

            # Reassign sequential numbers to avoid gaps/overlaps
            for cond in page_conditions:
                cond["condition_number"] = condition_offset
                condition_offset += 1

            all_conditions.extend(page_conditions)
            print(Fore.GREEN + f"Extracted {len(page_conditions)} conditions from pages {start_page}-{end_page}" + Fore.RESET)

        except Exception as e:
            print(Fore.RED + f"Error extracting pages {start_page}-{end_page}: {e}" + Fore.RESET)

    # Deduplicate conditions that may span page boundaries
    all_conditions = _deduplicate_conditions(all_conditions)

    # Re-number sequentially after dedup
    for i, cond in enumerate(all_conditions, start=1):
        cond["condition_number"] = i

    print(Fore.GREEN + f"\nSuccessfully extracted {len(all_conditions)} conditions!" + Fore.RESET)
    return {"conditions": all_conditions}


def _deduplicate_conditions(conditions):
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

def enrich_condition(condition_text, condition_name=None):
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
        print(Fore.RED + f"Enrichment error: {e}" + Fore.RESET)
        return {"clauses": [], "deliverables": [], "report_submissions": []}


def enrich_all_conditions(input_json):
    """Enrich all conditions with clauses, deliverables, and report submissions.

    Modifies input_json in place and returns it.
    """
    for condition in input_json.get("conditions", []):
        cond_num = condition.get("condition_number", "?")
        print(Fore.YELLOW + f"\nEnriching condition {cond_num}..." + Fore.RESET)

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
        print(Fore.GREEN + f"  Condition {cond_num}: {n_clauses} clauses, {n_deliverables} deliverables, {n_reports} report submissions" + Fore.RESET)

    return input_json


# ---------------------------------------------------------------------------
# Main orchestrator (new end-to-end pipeline)
# ---------------------------------------------------------------------------

def extract_and_enrich_all(file_input, classification):
    """Full extraction pipeline: extract conditions, enrich each one.

    Args:
        file_input: Gradio file object or file path string
        classification: dict from classify_and_count()

    Returns:
        dict: Complete JSON with conditions, clauses, deliverables, report_submissions
    """
    # Step 1: Extract all conditions
    print(Fore.CYAN + "\n=== STEP 1: Extracting conditions ===" + Fore.RESET)
    result = extract_conditions_from_pages(file_input, classification)

    # Step 2: Enrich each condition (clauses + report_submissions)
    print(Fore.CYAN + "\n=== STEP 2: Enriching conditions (clauses & report submissions) ===" + Fore.RESET)
    result = enrich_all_conditions(result)

    # Step 3: Extract deliverables using dedicated management plan extraction
    print(Fore.CYAN + "\n=== STEP 3: Extracting deliverables ===" + Fore.RESET)
    result = extract_management_plan_info_from_json(result)

    print(Fore.GREEN + f"\n=== Extraction complete: {len(result.get('conditions', []))} conditions ===" + Fore.RESET)
    return result


# ---------------------------------------------------------------------------
# Merge utility
# ---------------------------------------------------------------------------

def _merge_json_chunks(chunks):
    """Merge multiple JSON chunk strings into one."""
    merged = {"conditions": []}
    for chunk in chunks:
        if isinstance(chunk, str):
            chunk_json = json.loads(chunk)
        else:
            chunk_json = chunk
        merged["conditions"].extend(chunk_json.get("conditions", []))
    return json.dumps(merged)
