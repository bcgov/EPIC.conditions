import argparse
import json
import os
import re

from colorama import Fore, Style


def extract_parts(batch_name):
    match = re.match(r'(request_\d+-\d+)_([^.]+\.jsonl)', batch_name)
    return match.groups() if match else None


def extract_batch_name(file_name):
    match = re.match(r"batch_output_(batch_[a-zA-Z0-9]+)\.jsonl", file_name)
    return match.group(1) if match else None


def load_json_file(file_path):
    with open(file_path, "r") as f:
        return json.load(f)


def print_files_in_folder(folder_path):
    print(f"{Fore.GREEN}Files in the folder:{Style.RESET_ALL}")
    for jsonl_file in os.listdir(folder_path):
        print(jsonl_file)


def find_matching_batch_status(batch_statuses, batch_name=None, batch_id=None):
    for batch_status in batch_statuses:
        if batch_name and batch_status["batch_name"] == batch_name:
            return batch_status
        if batch_id and batch_status["batch_id"] == batch_id:
            return batch_status
    return None


def update_batch_file(original_file_path, request_range, new_batch_responses):
    with open(original_file_path, "r") as f:
        batch_responses = f.readlines()

    new_lines = []
    found = False
    for line in batch_responses:
        line_json = json.loads(line)
        if line_json["custom_id"] == request_range:
            found = True
            print(f"Found matching custom_id: {request_range}")
            new_lines.extend(new_batch_responses)
        else:
            new_lines.append(line)

    if found:
        with open(original_file_path, "w") as f:
            f.writelines(new_lines)
        return True
    return False


def update_batch_statuses(batch_statuses, file_name):
    for batch_status in batch_statuses:
        if batch_status["batch_name"] == file_name:
            batch_status["status"] = "completed"
            return batch_statuses
    return batch_statuses


def replace_length_errors(new_batch_responses_jsonl_files_folder_path):
    print_files_in_folder(new_batch_responses_jsonl_files_folder_path)

    length_error_batch_statuses = load_json_file("BATCH_STATUSES_LENGTH_FIX.json")
    batch_statuses = load_json_file("BATCH_STATUSES.json")

    for jsonl_file in os.listdir(new_batch_responses_jsonl_files_folder_path):
        batch_id = extract_batch_name(jsonl_file)
        print(f"{Fore.GREEN}Processing {batch_id}...{Style.RESET_ALL}")

        matching_length_error_status = find_matching_batch_status(length_error_batch_statuses, batch_id=batch_id)
        if not matching_length_error_status:
            print(f"{Fore.RED}No matching length error status for batch_id: {batch_id}{Style.RESET_ALL}")
            continue

        batch_name = matching_length_error_status["batch_name"]
        print(f"Found matching batch name: {batch_name}")

        parts = extract_parts(batch_name)
        if not parts:
            print(f"{Fore.RED}Failed to extract parts of the batch name.{Style.RESET_ALL}")
            continue

        request_range, file_name = parts
        print(f"Request range: {request_range}")
        print(f"File name: {file_name}")

        matching_batch_status = find_matching_batch_status(batch_statuses, batch_name=file_name)
        if not matching_batch_status:
            print(f"{Fore.RED}No matching batch status for file_name: {file_name}{Style.RESET_ALL}")
            # Debugging: print all batch statuses for more context
            print(f"{Fore.YELLOW}Available batch statuses:{Style.RESET_ALL}")
            for status in batch_statuses:
                print(status)
            continue

        original_batch_id = matching_batch_status["batch_id"]
        print(f"Original batch id: {original_batch_id}")

        for original_file_name in os.listdir("batch_responses_jsonl_files"):
            original_batch_name = extract_batch_name(original_file_name)
            if original_batch_name == original_batch_id:
                with open(f"{new_batch_responses_jsonl_files_folder_path}/{jsonl_file}", "r") as f:
                    new_batch_responses = f.readlines()

                if update_batch_file(f"batch_responses_jsonl_files/{original_file_name}", request_range, new_batch_responses):
                    print(f"{Fore.GREEN}Updated {original_file_name} with new responses.{Style.RESET_ALL}")
                    batch_statuses = update_batch_statuses(batch_statuses, file_name)
                    with open("BATCH_STATUSES.json", "w") as f:
                        json.dump(batch_statuses, f, indent=4)
                    print(f"{Fore.GREEN}Updated batch status for {file_name} to completed.{Style.RESET_ALL}")
                else:
                    print(f"{Fore.RED}No matching custom_id found for {request_range} in {original_file_name}.{Style.RESET_ALL}")
                break


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix all requests that returned a length error in the batch API calls by replacing the failed responses with newly generated ones.")
    parser.add_argument("new_batch_responses_jsonl_files_folder_path", help="Path to the folder containing the new batch responses JSONL files.")
    args = parser.parse_args()
    replace_length_errors(args.new_batch_responses_jsonl_files_folder_path)
