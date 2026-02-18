import os
import json

from colorama import Fore, Style
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "gpt-4o-2024-05-13"


def classify_document(file_text):
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
                                "The main section or topic headers found in the document that group conditions/commitments. "
                                "E.g., ['Environmental Management', 'Acid Rock Drainage Prevention', 'Monitoring', 'Fish and Aquatic Resources']. "
                                "Empty array if conditions are not grouped by sections."
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
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
            temperature=0.0,
            tool_choice={"type": "function", "function": {"name": "classify_document_structure"}},
        )

        result = json.loads(completion.choices[0].message.tool_calls[0].function.arguments)

        print(Fore.CYAN + f"\nDocument Classification:" + Fore.RESET)
        print(Fore.CYAN + f"  Type: {result['document_type']}" + Fore.RESET)
        print(Fore.CYAN + f"  Has numbered conditions: {result['has_numbered_conditions']}" + Fore.RESET)
        print(Fore.CYAN + f"  Section headers: {result['section_headers']}" + Fore.RESET)
        print(Fore.CYAN + f"  Estimated item count: {result['estimated_item_count']}" + Fore.RESET)

        return result

    except Exception as e:
        print(Fore.RED + f"Classification error: {e}" + Fore.RESET)
        # Default to numbered_conditions for backward compatibility
        return {
            "document_type": "numbered_conditions",
            "has_numbered_conditions": True,
            "section_headers": [],
            "estimated_item_count": 0,
        }
