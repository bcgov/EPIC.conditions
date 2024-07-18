import argparse
import json
import os
from colorama import Fore, Style
from generate_all_batch_input_jsonls import generate_batch_input_jsonl

def generate_all_batch_input_jsonls_length_fix(batch_statuses_json):
    with open(batch_statuses_json, "r") as f:
        batch_statuses_json = json.load(f)

    for batch in batch_statuses_json:
        if batch.get("status") == "length_error":
            print(f"{Fore.YELLOW}Fixing length error for batch: {Fore.CYAN}{batch.get('batch_name')}{Style.RESET_ALL}")

            batch_id = batch.get("batch_id")
            batch_file_path = f"batch_responses_jsonl_files/batch_output_{batch_id}.jsonl"

            with open(batch_file_path, "r") as file:
                for line in file:
                    line_json = json.loads(line)
                    finish_reason = line_json['response']['body']['choices'][0]['finish_reason']

                    if finish_reason == "length":
                        print(f"{Fore.RED}Length error detected{Style.RESET_ALL}")
                        print(f"{Fore.GREEN}Batch ID: {Fore.CYAN}{batch['batch_id']}{Style.RESET_ALL}")
                        print(f"{Fore.GREEN}Request ID: {Fore.CYAN}{line_json['id']}{Style.RESET_ALL}")

                        print(f"{Fore.GREEN}Custom ID: {Fore.CYAN}{line_json['custom_id']}{Style.RESET_ALL}")

                        start_condition = int(line_json["custom_id"].split("_")[1].split("-")[0])
                        end_condition = int(line_json["custom_id"].split("_")[1].split("-")[1])

                        pdf_name = batch["batch_name"].replace(".jsonl", ".pdf")
                        print(f"{Fore.GREEN}PDF Name: {Fore.CYAN}{pdf_name}{Style.RESET_ALL}")

                        pdf_path = f"../test_documents/pdfs_for_batch_processing/{pdf_name}"

                        output_folder = "batch_requests_jsonl_files_length_fix"
                        os.makedirs(output_folder, exist_ok=True)

                        output_file_path = f"./{output_folder}/{line_json['custom_id']}_{batch['batch_name']}"
                        generate_batch_input_jsonl(pdf_path, 999, output_file_path, 1, start_condition, end_condition)

                        print(f"{Fore.GREEN}New batch input JSONL file generated at: {Fore.CYAN}{output_file_path}{Style.RESET_ALL}")

    print(f"{Fore.GREEN}All length error requests JSONLs have been generated.{Style.RESET_ALL}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix all requests that returned a length error in the batch API calls")
    parser.add_argument("batch_statuses_json", type=str, help="Batch statuses JSON file")
    args = parser.parse_args()

    generate_all_batch_input_jsonls_length_fix(args.batch_statuses_json)
