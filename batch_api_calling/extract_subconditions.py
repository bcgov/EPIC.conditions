import sys
sys.path.append('..')
import os
import argparse 
from colorama import Fore, Style
from openai import OpenAI
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from gpt import extract_all_subconditions

def extract_subconditions_from_all_docs(jsons_folder_path, output_folder_path):
    if not os.path.exists(output_folder_path):
        os.makedirs(output_folder_path)

    for file in os.listdir(jsons_folder_path):
        if file.endswith('.json'):
            output_file_path = os.path.join(output_folder_path, file)
            if os.path.exists(output_file_path):
                print(f"Skipping {file} as it already exists in the output folder")
                continue
            print(Fore.CYAN + f"\n\nExtracting subconditions from {file}" + Style.RESET_ALL)
            input_file_path = os.path.join(jsons_folder_path, file)
            
            # Read the input JSON file
            with open(input_file_path, 'r') as f:
                input_json = json.load(f)
            
            # Process the JSON
            updated_json = extract_all_subconditions(input_json)

            print(Fore.YELLOW + "Updated JSON:" + Style.RESET_ALL)
            
            # Write the updated JSON to the output file
            with open(output_file_path, 'w') as f:
                json.dump(updated_json, f, indent=4)

    print(Fore.GREEN + f"SUCCESS: All management plans extracted to new JSONs in {output_folder_path}" + Style.RESET_ALL)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--jsons_folder_path', 
        type=str, 
        default='./condition_jsons_with_first_nations', 
        help='Path to the folder containing the JSONs (default: ./condition_jsons_with_first_nations)'
    )
    parser.add_argument(
        '--output_folder_path', 
        type=str, 
        default='./condition_jsons_with_subconditions', 
        help='Path to the folder to save the updated JSONs (default: ./condition_jsons_with_subconditions)'
    )
    args = parser.parse_args()

    extract_subconditions_from_all_docs(args.jsons_folder_path, args.output_folder_path)