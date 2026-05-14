import json
import logging

from typing import Any, Dict

from condition_cron.extraction.client import get_openai_client

logger = logging.getLogger(__name__)

ELIGIBILITY_TEXT_LIMIT = 16000

DOCUMENT_FAMILIES = {
    "eao_certificate",
    "schedule_b_table_of_conditions",
    "order_conditions",
    "amendment",
    "other_environmental_assessment_conditions",
    "unsupported",
    "uncertain",
}

UNSUPPORTED_DOCUMENT_FAMILIES = {
    "amendment",
    "unsupported",
}

SUPPORTED_SIGNALS = [
    "environmental assessment certificate",
    "environmental assessment office",
    "schedule b",
    "table of conditions",
    "certificate holder",
    "the holder must",
    "holder must",
    "bceaa",
    "environmental assessment act",
    "eao",
    "condition 1",
    "condition 2",
    "certified project description",
    "mitigation measures",
    "management plan",
    "prior to construction",
    "prior to operations",
]

UNSUPPORTED_SIGNALS = [
    "amendment to environmental assessment certificate",
    "certificate amendment",
    "amendment certificate",
    "amended certificate",
    "amendment order",
    "amendment",
    "rental application",
    "tenant",
    "landlord",
    "monthly rent",
    "lease agreement",
    "employment application",
    "resume",
    "invoice",
    "purchase order",
    "vehicle registration",
    "emergency contact",
    "applicant income",
    "credit check",
]


def _readable_text(file_text: str) -> str:
    """Collapse whitespace for lightweight text checks."""
    return " ".join((file_text or "").split())


def _normalized_text(file_text: str) -> str:
    """Normalize text for case-insensitive signal matching."""
    return _readable_text(file_text).lower()


def _find_signals(file_text: str, signals: list[str], limit: int = 8) -> list[str]:
    """Return matched signal phrases in their configured order."""
    text = _normalized_text(file_text)
    return [signal for signal in signals if signal in text][:limit]


def _clip_document_text(file_text: str) -> str:
    """Keep enough text for classification without sending the whole document."""
    text = _readable_text(file_text)
    if len(text) <= ELIGIBILITY_TEXT_LIMIT:
        return text

    half = ELIGIBILITY_TEXT_LIMIT // 2
    return f"{text[:half]}\n\n[...document text clipped...]\n\n{text[-half:]}"


def _unsupported_eligibility(reason: str, evidence: list[str], confidence: float = 1.0) -> Dict[str, Any]:
    """Build a consistent unsupported eligibility response."""
    return {
        "is_supported_document": False,
        "document_family": "unsupported",
        "confidence": confidence,
        "reason": reason,
        "evidence": evidence,
    }


def _fail_open_eligibility(reason: str) -> Dict[str, Any]:
    """Allow extraction when eligibility classification cannot make a safe call."""
    return {
        "is_supported_document": True,
        "document_family": "uncertain",
        "confidence": 0.0,
        "reason": reason,
        "evidence": [],
    }


def _normalize_eligibility_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize model output so downstream blocking logic stays simple."""
    is_supported = result.get("is_supported_document")
    if not isinstance(is_supported, bool):
        is_supported = True

    document_family = result.get("document_family")
    if document_family not in DOCUMENT_FAMILIES:
        document_family = (
            "other_environmental_assessment_conditions"
            if is_supported
            else "unsupported"
        )
    if document_family in UNSUPPORTED_DOCUMENT_FAMILIES:
        is_supported = False

    try:
        confidence = float(result.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(confidence, 1.0))

    evidence = result.get("evidence") or []
    if not isinstance(evidence, list):
        evidence = [str(evidence)]
    evidence = [str(item).strip() for item in evidence if str(item).strip()]

    reason = str(result.get("reason") or "").strip()
    if not reason:
        reason = (
            "Document appears eligible for condition extraction."
            if is_supported
            else "Document does not appear to be a supported EAO conditions document."
        )

    return {
        "is_supported_document": is_supported,
        "document_family": document_family,
        "confidence": confidence,
        "reason": reason,
        "evidence": evidence,
    }


def is_document_supported_for_extraction(
    eligibility: Dict[str, Any],
    unsupported_confidence_threshold: float = 0.75,
) -> bool:
    """Return False only for high-confidence unsupported classifications.

    The gate intentionally fails open. If the classifier is uncertain, extraction
    continues so staff review can catch any bad output instead of hiding a valid
    document.
    """
    if eligibility.get("document_family") not in UNSUPPORTED_DOCUMENT_FAMILIES and eligibility.get(
        "is_supported_document",
        True,
    ):
        return True

    try:
        confidence = float(eligibility.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0

    return confidence < unsupported_confidence_threshold


def classify_document_eligibility(file_text: str) -> Dict[str, Any]:
    """Classify whether a document should be sent to condition extraction.

    This is a content gate, not a structure classifier. It should reject only
    documents that are clearly unrelated to EAO/environmental assessment
    conditions.
    """
    readable_text = _readable_text(file_text)
    if not readable_text:
        return _unsupported_eligibility(
            "No readable text was found in the document.",
            ["No readable text"],
            confidence=1.0,
        )

    supported_signals = _find_signals(readable_text, SUPPORTED_SIGNALS)
    unsupported_signals = _find_signals(readable_text, UNSUPPORTED_SIGNALS)

    tools = [
        {
            "type": "function",
            "function": {
                "name": "classify_document_eligibility",
                "description": "Decide whether a document is eligible for EAO condition extraction.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "is_supported_document": {
                            "type": "boolean",
                            "description": (
                                "True when the document appears to be an EAO/environmental assessment "
                                "certificate, order, Schedule B, table of conditions, or similar "
                                "condition/commitment document. False for amendment documents."
                            ),
                        },
                        "document_family": {
                            "type": "string",
                            "enum": sorted(DOCUMENT_FAMILIES),
                            "description": "The closest supported document family, or unsupported/uncertain.",
                        },
                        "confidence": {
                            "type": "number",
                            "description": "Confidence in this eligibility decision, from 0.0 to 1.0.",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Short staff-facing explanation for the decision.",
                        },
                        "evidence": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Short phrases from the document that support the decision.",
                        },
                    },
                    "required": [
                        "is_supported_document",
                        "document_family",
                        "confidence",
                        "reason",
                        "evidence",
                    ],
                },
            },
        }
    ]

    prompt = (
        "Classify whether this file should be processed by an EAO conditions extractor.\n\n"
        "Supported documents include BC Environmental Assessment Office certificates, "
        "Schedule B/Table of Conditions documents, orders with conditions, and similar "
        "environmental assessment condition or commitment documents.\n\n"
        "Unsupported documents include rental applications, leases, invoices, resumes, "
        "employment forms, generic applications, contracts unrelated to environmental "
        "assessment conditions, files with no condition-like EAO content, and EAO "
        "amendment documents. Amendments are not supported by the conditions repository "
        "yet; if the document is an amendment, mark it unsupported with document_family "
        "'amendment'.\n\n"
        "Be permissive: if the document could reasonably be an EAO/environmental "
        "assessment conditions document, mark it supported. Mark unsupported only "
        "when the document is clearly unrelated. Numbered sections alone are not "
        "enough; look for domain evidence and obligation language.\n\n"
        f"Readable text character count: {len(readable_text)}\n"
        f"Matched supported keyword hints: {supported_signals or 'none'}\n"
        f"Matched unsupported keyword hints: {unsupported_signals or 'none'}\n\n"
        f"Document text:\n\n{_clip_document_text(readable_text)}"
    )

    messages = [{"role": "user", "content": prompt}]

    try:
        client = get_openai_client()
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            temperature=0.0,
            tool_choice={"type": "function", "function": {"name": "classify_document_eligibility"}},
        )

        arguments = completion.choices[0].message.tool_calls[0].function.arguments
        result = _normalize_eligibility_result(json.loads(arguments))
        logger.info(
            "Document Eligibility - Supported: %s, Family: %s, Confidence: %.2f, Reason: %s",
            result["is_supported_document"],
            result["document_family"],
            result["confidence"],
            result["reason"],
        )
        return result

    except Exception as e:
        logger.error("Eligibility classification error: %s", e, exc_info=True)
        return _fail_open_eligibility("Eligibility classifier failed; continuing extraction.")


def classify_document(file_text: str) -> Dict[str, Any]:
    """Classify the structure of a document to determine the extraction strategy.

    Returns a dict with:
        document_type: "numbered_conditions" | "table_format" | "bulleted_commitments" | "mixed"
        has_numbered_conditions: bool
        section_headers: list of section/topic headers found
        estimated_item_count: int (approximate number of discrete conditions/commitments)
    """

    tools = [
        {
            "type": "function",
            "function": {
                "name": "classify_document_structure",
                "description": "Classify the structure and format of an environmental assessment document.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "document_type": {
                            "type": "string",
                            "enum": ["numbered_conditions", "table_format", "bulleted_commitments", "mixed"],
                            "description": (
                                "The primary structure of conditions/commitments in this document. "
                                "'numbered_conditions': items are explicitly numbered (e.g., Condition 1, Condition 2, or 1., 2., etc.). "
                                "'table_format': items are in a table structure with columns (e.g., Component/Commitment, Category/Requirement). "
                                "'bulleted_commitments': items are bullet points or dashes grouped under topic headings, without explicit numbering. "
                                "'mixed': document uses a combination of the above formats."
                            ),
                        },
                        "has_numbered_conditions": {
                            "type": "boolean",
                            "description": "True if the document contains explicitly numbered conditions (e.g., 'Condition 1', '1.', 'Condition #1').",
                        },
                        "section_headers": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": (
                                "The main topic or subject-matter headers that group conditions/commitments — NOT preamble or structural headings. "
                                "EXCLUDE generic document sections such as 'Definitions', 'Acronyms', 'Conditions', 'Introduction', 'Background', 'Purpose', 'Scope', 'General', 'Schedule'. "
                                "INCLUDE only substantive environmental or project topic headings that categorise the actual conditions, "
                                "e.g., ['Environmental Management', 'Acid Rock Drainage Prevention', 'Fish and Aquatic Resources', 'Air Quality', 'Wildlife']. "
                                "Empty array if conditions are not grouped by topic sections."
                            ),
                        },
                        "estimated_item_count": {
                            "type": "integer",
                            "description": (
                                "The approximate number of discrete, top-level conditions/commitments/requirements in the document. "
                                "Do NOT count sub-items, bullet sub-points, or nested clauses as separate items. "
                                "Count each main condition or each distinct commitment/requirement as one item."
                            ),
                        },
                    },
                    "required": [
                        "document_type",
                        "has_numbered_conditions",
                        "section_headers",
                        "estimated_item_count",
                    ],
                },
            },
        }
    ]

    prompt = (
        "Analyze the structure of this environmental assessment document. "
        "Determine how the conditions, commitments, or requirements are organized.\n\n"
        "Key questions to answer:\n"
        "1. Are the conditions/commitments explicitly numbered (e.g., 'Condition 1', 'Condition 2')?\n"
        "2. Are they in a table format with columns (e.g., Component | Commitment)?\n"
        "3. Are they organized as bullet points under topic/section headers?\n"
        "4. What are the main section or topic headers?\n"
        "5. How many discrete top-level conditions/commitments are there?\n\n"
        f"Document text:\n\n{file_text}"
    )

    messages = [{"role": "user", "content": prompt}]

    try:
        client = get_openai_client()
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            temperature=0.0,
            tool_choice={"type": "function", "function": {"name": "classify_document_structure"}},
        )

        result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)

        logger.info(
            "Document Classification - Type: %s, Numbered: %s, Estimated Count: %s, Headers: %s",
            result['document_type'],
            result['has_numbered_conditions'],
            result['estimated_item_count'],
            result['section_headers']
        )

        return result

    except Exception as e:
        logger.error("Classification error: %s", e, exc_info=True)
        # Default to numbered_conditions for backward compatibility
        return {
            "document_type": "numbered_conditions",
            "has_numbered_conditions": True,
            "section_headers": [],
            "estimated_item_count": 0,
        }
