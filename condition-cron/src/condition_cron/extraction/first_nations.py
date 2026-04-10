import json
import logging
import os

from openai import OpenAI
from condition_cron.extraction.pdf_reader import read_pdf

logger = logging.getLogger(__name__)


class _NoColor:
    RED = GREEN = CYAN = RESET = ""


Fore = _NoColor()


client = OpenAI(
    api_key=os.getenv("EXTRACTOR_API_KEY") or os.getenv("OPENAI_API_KEY") or "not-set",
    base_url=f"{os.getenv('EXTRACTOR_API_URL', '').rstrip('/')}/v1" if os.getenv("EXTRACTOR_API_URL") else None,
)

def extract_first_nation_from_pdf(pdf_file_path):
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

    completion = client.chat.completions.create(
        model="gpt-4o-2024-05-13",
        messages=messages,
        tools=tools,
        temperature=0.0,
        tool_choice={"type": "function", "function": {"name": "format_info"}}
    )

    print(completion.choices[0].message.tool_calls[0].function.arguments)
    return completion.choices[0].message.tool_calls[0].function.arguments

def process_single_pdf(pdf_file_path, old_json):
    first_nations_info = extract_first_nation_from_pdf(pdf_file_path)
    first_nations_json = json.loads(first_nations_info)
    
    updated_json = old_json.copy()
    updated_json['first_nations'] = first_nations_json['first_nations']
    updated_json['consultation_records_required'] = first_nations_json['consultation_records_required']
    
    return updated_json
