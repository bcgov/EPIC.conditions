import json
import logging

from typing import Any, Dict

from condition_cron.extraction.client import get_openai_client
from condition_cron.extraction.pdf_reader import read_pdf

logger = logging.getLogger(__name__)

def extract_first_nation_from_pdf(pdf_file_path: str) -> str:
    pdf_text = read_pdf(pdf_file_path)

    tools = [
        {
            "type": "function",
            "function": {
                "name": "format_info",
                "description": "Format the information extracted from the PDF text.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "first_nations": {
                            "type": "array",
                            "description": "A list of all of the indigenous nations/First Nations/aboriginal peoples that need to be consulted that are in this document.",
                            "items": {
                                "type": "string",
                            },
                        },
                        "consultation_records_required": {
                            "type": "boolean",
                            "description": "Does the document state that consultation records are required to be kept?",
                        },
                    },
                    "required": ["first_nations", "consultation_records_required"],
                },
            }
        }
    ]
    messages = [{"role": "user", "content": f"{pdf_text}\n\n\n\nThis is a document written by the BC Environmental Assessment Office. Extract the names of the indigenous nations/First Nations/aboriginal peoples that need to be consulted."}]

    client = get_openai_client()
    completion = client.chat.completions.create(
        model="gpt-4o-2024-05-13",
        messages=messages,
        tools=tools,
        temperature=0.0,
        tool_choice={"type": "function", "function": {"name": "format_info"}}
    )

    result = completion.choices[0].message.tool_calls[0].function.arguments
    logger.debug("Extracted First Nations info: %s", result)
    return result

def process_single_pdf(pdf_file_path: str, old_json: Dict[str, Any]) -> Dict[str, Any]:
    first_nations_info = extract_first_nation_from_pdf(pdf_file_path)
    first_nations_json = json.loads(first_nations_info)
    
    updated_json = old_json.copy()
    updated_json['first_nations'] = first_nations_json['first_nations']
    updated_json['consultation_records_required'] = first_nations_json['consultation_records_required']
    
    return updated_json
