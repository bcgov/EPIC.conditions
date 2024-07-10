import argparse
import json
import os
import re

from colorama import Fore, Style

# Extracts and separates parts of batch_name. E.g. request_21-25_table_of_conditions_baldy_ridge.jsonl -> request_21-25, table_of_conditions_baldy_ridge.jsonl
def extract_parts(batch_name):
    match = re.match(r'(request_\d+-\d+)_([^.]+\.jsonl)', batch_name)
    if match:
        return match.groups()
    return None

def extract_batch_name(file_name):
    # batch_output_batch_BbAGu4EqdpajlWLV9YzszZf2.jsonl
    # Extract "batch_BbAGu4EqdpajlWLV9YzszZf2" from the file name
    # e.g. batch_output_batch_BbAGu4EqdpajlWLV9YzszZf2.jsonl -> batch_BbAGu4EqdpajlWLV9YzszZf2
    match = re.match(r"batch_output_(batch_[a-zA-Z0-9]+)\.jsonl", file_name)
    if match is None:
        return None
    return match.group(1)

def replace_length_errors(new_batch_responses_jsonl_files_folder_path):
    # print file names in the folder
    print(f"{Fore.GREEN}Files in the folder:{Style.RESET_ALL}")
    for jsonl_file in os.listdir(new_batch_responses_jsonl_files_folder_path):
        print(jsonl_file)

        batch_id = extract_batch_name(jsonl_file)
        print(f"{Fore.GREEN}Processing {batch_id}...{Style.RESET_ALL}")

        with open("LENGTH_ERROR_BATCH_STATUSES.json", "r") as f:
            length_error_batch_statuses_json = json.load(f)

        for length_error_batch_status in length_error_batch_statuses_json:
            if length_error_batch_status["batch_id"] == batch_id:
                batch_name = length_error_batch_status["batch_name"]
                print(f"Found matching batch name: {batch_name}")

                # Extract parts of the batch name
                parts = extract_parts(batch_name)
                if parts is None:
                    print(f"{Fore.RED}Failed to extract parts of the batch name.{Style.RESET_ALL}")
                    continue

                request_range, file_name = parts
                print(f"Request range: {request_range}")
                print(f"File name: {file_name}")

                # Open BATCH_STATUSES.json
                with open("BATCH_STATUSES.json", "r") as f:
                    batch_statuses_json = json.load(f)

                # Find the batch status with the matching batch name
                for batch_status in batch_statuses_json:
                    if batch_status["batch_name"] == file_name:
                        # extract the batch_id from the batch status
                        original_batch_id = batch_status["batch_id"]
                        print(f"Original batch id: {original_batch_id}")

                        # Loop through files in /batch_responses_jsonl_files
                        for original_file_name in os.listdir("batch_responses_jsonl_files"):
                            print(f"Processing {original_file_name}...")

                            original_batch_name = extract_batch_name(original_file_name)
                            print(f"Original batch name: {original_batch_name}")

                            if original_batch_name == original_batch_id:
                                # open the original file
                                with open(f"batch_responses_jsonl_files/{original_file_name}", "r") as f:
                                    batch_responses_jsonl = f.readlines()

                                new_lines = []
                                with open(f"{new_batch_responses_jsonl_files_folder_path}/{jsonl_file}", "r") as f:
                                    new_batch_responses_jsonl = f.readlines()
                                
                                found = False
                                for line in batch_responses_jsonl:
                                    line_json = json.loads(line)
                                    if line_json["custom_id"] == request_range:
                                        found = True
                                        print(f"Found matching custom_id: {request_range}")
                                        # Replace the line with new batch responses
                                        new_lines.extend(new_batch_responses_jsonl)
                                    else:
                                        new_lines.append(line)
                                
                                if found:
                                    # Write the new content back to the original file
                                    with open(f"batch_responses_jsonl_files/{original_file_name}", "w") as f:
                                        f.writelines(new_lines)
                                    print(f"{Fore.GREEN}Updated {original_file_name} with new responses.{Style.RESET_ALL}")
                                else:
                                    print(f"{Fore.RED}No matching custom_id found for {request_range} in {original_file_name}.{Style.RESET_ALL}")

                        break

                break

    return

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix all requests that returned a length error in the batch API calls by replacing the failed responses with newly generated ones.")
    parser.add_argument("new_batch_responses_jsonl_files_folder_path", help="Path to the folder containing the new batch responses JSONL files.")

    args = parser.parse_args()

    replace_length_errors(args.new_batch_responses_jsonl_files_folder_path)
