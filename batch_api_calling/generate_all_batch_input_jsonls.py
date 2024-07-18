import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import argparse
import json
import read_pdf

from colorama import Fore, Back, Style

def get_single_batch_input_request(file_name, starting_condition_number, ending_condition_number, output_file):
      
    file_text = None
    with open(file_name, "r") as f:

        # If file is a PDF, convert it to text
        if file_name.endswith(".pdf"):
            file_text = read_pdf.read_pdf(file_name)
        elif file_name.endswith(".txt"):
            file_text = f.read()
        else:
            return "File 1 is not a PDF or TXT file"

    conditions_list_description = f"Conditions {starting_condition_number} (inclusive) up to and including {ending_condition_number} extracted from the document. ALWAYS include the condition name."

    if starting_condition_number == ending_condition_number:
        conditions_list_description = f"Only condition {starting_condition_number} extracted from the document. ALWAYS includes the condition name."

    tools = [
        {
            "type": "function",
            "function": {
                "name": "format_info",
                "description": "Format the information extracted from the document.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "conditions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "condition_name": {"type": "string", "description": "The name of the condition. REQUIRED."},
                                    "condition_number": {"type": "integer", "description": "The number associated with the condition."},
                                    "condition_text": {"type": "string", "description": "The text of the condition. Fix spacing issues. Include the same newlines as in the document."},
                                },
                            },
                            "description": conditions_list_description,
                        },
                    },
                    "required": ["conditions", "conditions.condition_name"],
                },
            }
        }
    ]
    messages = [{"role": "user", "content": f"Here is a document with conditions:\n\n{file_text}\n\nExtract conditions {starting_condition_number} to {ending_condition_number}."}]

    json_object = {
        "custom_id": f"request_{starting_condition_number}-{ending_condition_number}",
        "method": "POST",
        "url": "/v1/chat/completions",
        "body": {
            "model": "gpt-4o-2024-05-13",
            "messages": messages,
            "tools": tools,
            "tool_choice": {"type": "function", "function": {"name": "format_info"}}
        }
    }

    with open(output_file, "a") as jsonl_file:
        jsonl_file.write(json.dumps(json_object) + "\n")
  
def generate_batch_input_jsonl(file_input, number_of_conditions, output_file, chunk_size=5, start_condition=1, end_condition=None):
    if end_condition is None:
        end_condition = number_of_conditions

    # Clear output file if it already exists
    with open(output_file, "w") as f:
        pass

    for i in range(start_condition - 1, end_condition, chunk_size):
        end = min(i + chunk_size, end_condition)
        get_single_batch_input_request(file_input, i + 1, end, output_file)

def generate_all_batch_input_jsonls(condition_count_json_path):
    with open(condition_count_json_path, 'r') as file:
        data = json.load(file)

        document_file_paths = "../test_documents/pdfs_for_batch_processing/"
        
        for document in data:
            file_path = os.path.join(document_file_paths, document['file_name'])
            output_file = os.path.join("batch_requests_jsonl_files", f"{os.path.splitext(document['file_name'])[0]}.jsonl")
            
            # Ensure the output directory exists
            os.makedirs(os.path.dirname(output_file), exist_ok=True)

            # Clear the file if it already exists
            with open(output_file, "w") as f:
                pass

            generate_batch_input_jsonl(file_path, document['conditions_count'], output_file)
            print(Fore.GREEN + f"Generated JSONL file: {output_file}" + Style.RESET_ALL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a JSONL file for batch API requests")
    parser.add_argument("condition_count_json", type=str, help="Path to the CONDITION_COUNT.json file")
    args = parser.parse_args()

    generate_all_batch_input_jsonls(args.condition_count_json)
