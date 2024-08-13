import sys
sys.path.append('..')
import os
import argparse 
from colorama import Fore, Style
from read_pdf import read_pdf
import json

from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_first_nation_from_pdf(pdf_file_path):
    with open(pdf_file_path, "rb") as f:
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

def extract_all_first_nations(jsons_folder_path, pdfs_folder_path, output_folder_path):
    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for file in os.listdir(jsons_folder_path):
        if file.endswith('.json'):
            output_file_path = os.path.join(output_folder_path, file)
            if os.path.exists(output_file_path):
                print(f"Skipping {file} as it already exists in the output folder")
                continue
            
            print(Fore.CYAN + f"Extracting first nations info from {file}" + Style.RESET_ALL)
            input_file_path = os.path.join(pdfs_folder_path, file.replace('.json', '.pdf'))
            
            # Read the old JSON
            with open(os.path.join(jsons_folder_path, file), 'r') as f:
                old_json = json.load(f)
            
            # Process the PDF and update the JSON
            updated_json = process_single_pdf(input_file_path, old_json)
            
            # Save the updated JSON
            with open(output_file_path, 'w') as f:
                json.dump(updated_json, f, indent=4)

    print(Fore.GREEN + f"SUCCESS: All first nations extracted to new JSONs in {output_folder_path}" + Style.RESET_ALL)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--jsons_folder_path', 
        type=str, 
        default='./condition_jsons_with_management_plans', 
        help='Path to the folder containing the JSONs (default: ./condition_jsons_with_management_plans)'
    )
    parser.add_argument(
        '--pdfs_folder_path', 
        type=str, 
        default='../test_documents/pdfs_for_batch_processing', 
        help='Path to the folder containing the PDFs (default: ../test_documents/pdfs_for_batch_processing)'
    )
    parser.add_argument(
        '--output_folder_path', 
        type=str, 
        default='./condition_jsons_with_first_nations',
        help='Path to the folder to save the updated JSONs (default: ./condition_jsons_with_first_nations)'
    )
    args = parser.parse_args()

    extract_all_first_nations(args.jsons_folder_path, args.pdfs_folder_path, args.output_folder_path)