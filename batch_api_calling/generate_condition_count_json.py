import argparse
import json
import os
import sys
from openai import OpenAI
from colorama import Fore, Style

from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from gpt import count_conditions

def generate_condition_count_json(condition_documents_folder_path):
    # Check if CONDITION_COUNT.json exists and read its content
    condition_count_file_path = "CONDITION_COUNT.json"
    if os.path.exists(condition_count_file_path):
        with open(condition_count_file_path, 'r') as json_file:
            existing_data = json.load(json_file)
        print(Fore.GREEN + "Loaded existing CONDITION_COUNT.json" + Style.RESET_ALL)
    else:
        existing_data = []

    # Convert existing data to a dictionary for quick lookup
    existing_data_dict = {item['file_name']: item['conditions_count'] for item in existing_data}

    # List of all files in the folder
    files = os.listdir(condition_documents_folder_path)

    # Initialize a list to hold the data for each file
    data = []

    for file in files:
        if file in existing_data_dict:
            # File already processed, skip it
            print(Fore.YELLOW + f"Skipping {file} as it's already processed." + Style.RESET_ALL)
            continue

        file_path = os.path.join(condition_documents_folder_path, file)
        with open(file_path, 'r') as f:
            conditions_count = count_conditions(f)
            data.append({
                "file_name": file,
                "conditions_count": conditions_count
            })
            print(Fore.CYAN + f"Processed {file}: {conditions_count}" + Style.RESET_ALL)

    # Combine new data with existing data
    data.extend(existing_data)

    # Write the combined data to a JSON file
    with open(condition_count_file_path, 'w') as json_file:
        json.dump(data, json_file, indent=4)
    print(Fore.GREEN + "Updated CONDITION_COUNT.json with new data." + Style.RESET_ALL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a JSON with PDF names and their condition counts")
    parser.add_argument("condition_documents_folder", type=str, help="Path to the folder containing condition documents")
    args = parser.parse_args()

    generate_condition_count_json(args.condition_documents_folder)
