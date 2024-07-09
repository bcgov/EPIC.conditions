import argparse
import json
import os
import re

from colorama import Fore, Style

def replace_responses_with_length_errors(request_id, original_batch_responses_jsonl_file_path, fixed_batch_responses_jsonl_file_path):

    # open original batch responses JSONL file, then replace the line with custom_id of request_id with the new response
    with open(original_batch_responses_jsonl_file_path, "w") as original_batch_responses_file:
        with open(fixed_batch_responses_jsonl_file_path, "w") as fixed_batch_responses_file:
            # Replace the line in original batch responses JSONL file with the new response


            # CONTINUE HERE
            pass

# Extracts and separates parts of batch_name. E.g. request_21-25_table_of_conditions_baldy_ridge.jsonl -> request_21-25, table_of_conditions_baldy_ridge.jsonl
def extract_parts(batch_name):
    match = re.match(r'(request_\d+-\d+)_([^.]+\.jsonl)', batch_name)
    if match:
        return match.groups()
    return None

def fix_length_errors(batch_statuses_json):
    
    with open(batch_statuses_json, "r") as batch_statuses_file:
        batch_statuses_json = json.load(batch_statuses_file)


            # Extracting parts from each batch_name in the data
    extracted_parts = [extract_parts(item['batch_name']) for item in batch_statuses_json]



    with open('./BATCH_STATUSES.json', "r") as original_batch_statuses_file:
        original_batch_statuses_json = json.load(original_batch_statuses_file)

    # Displaying the results
    for parts in extracted_parts:
        if parts:
            print(f"Request: {parts[0]} | File: {parts[1]}")

            request_id = parts[0]
            batch_name = parts[1]

            # Find the corresponding batch in the original data
            for batch in original_batch_statuses_json:
                if batch['batch_name'] == batch_name:
                    batch_id = batch['batch_id']
                    print(f"Batch ID: {batch_id}")

                    original_batch_responses_jsonl_file_path = f"batch_responses_jsonl_files/batch_output_{batch_id}.jsonl"
                    print(f"Original batch responses JSONL file path: {original_batch_responses_jsonl_file_path}")

                    fixed_batch_responses_jsonl_file_path = f"batch_responses_length_fix/batch_output_batch_5i5sjwOyScrvJYH0k4igCI8W.jsonl.jsonl"

                    replace_responses_with_length_errors(request_id, original_batch_responses_jsonl_file_path, fixed_batch_responses_jsonl_file_path)

        else:
            print("No match found")

    # for batch in batch_statuses_json:

    #     print(Fore.CYAN + f"HANDLING {batch["batch_name"]} | {batch["batch_id"]}" + Style.RESET_ALL)


    #     # Extract file name from batch name e.g. request_21-25_table_of_conditions_baldy_ridge.jsonl -> table_of_conditions_baldy_ridge.jsonl
    #     file_name = batch["batch_name"].split("_")[-1]
    #     print(f"FILE NAME: {file_name}")



        # Open corresponding batch output file
        # with open(f"batch_responses_length_fix/batch_output_{batch_id}.jsonl", "r") as response_file:
            # for line in response_file:
            #     line_json = json.loads(line)
            #     print(line_json["id"])

            # with open(f"BATCH_STATUSES.json", "r") as batch_statuses_file:
            #     batch_statuses_json = json.load(batch_statuses_file)
            #     print(batch_statuses_json)

        



    return


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix all requests that returned a length error in the batch API calls by replacing the failed responses with newly generated ones.")
    parser.add_argument("batch_statuses_json", type=str, help="Batch statuses JSON file")
    args = parser.parse_args()

    fix_length_errors(args.batch_statuses_json)