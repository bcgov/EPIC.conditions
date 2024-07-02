from openai import OpenAI
client = OpenAI()
import argparse
import json
from collections import defaultdict
import os

from colorama import Fore, Back, Style

def retrieve_batch_status(batch_id):
    response = client.batches.retrieve(batch_id)

    batch_status = response.status
    return batch_status


def update_all_batch_statuses(batch_statuses_json_path):
    with open(batch_statuses_json_path, "r") as file:
        batch_statuses_json = json.load(file)

    for batch in batch_statuses_json:
        batch_id = batch.get("batch_id")
        batch_status = retrieve_batch_status(batch_id)
        batch["status"] = batch_status

    with open(batch_statuses_json_path, "w") as file:
        json.dump(batch_statuses_json, file, indent=4)

def check_all_batch_completion(batch_statuses_json_path):
    with open(batch_statuses_json_path, "r") as file:
        batch_statuses_json = json.load(file)

    # Initialize dictionaries to store counts and batches
    status_counts = defaultdict(int)
    status_batches = defaultdict(list)

    for batch in batch_statuses_json:
        batch_name = batch.get("batch_name")
        batch_id = batch.get("batch_id")
        batch_status = batch.get("status")

        # Update counts and batch lists
        status_counts[batch_status] += 1
        status_batches[batch_status].append((batch_name, batch_id))

    # Check for non-completed batches
    all_completed = True
    for status in status_counts.keys():
        if status != "completed":
            all_completed = False
            break

    # Print summary
    if all_completed:
        print(Fore.GREEN + "ALL BATCHES COMPLETED" + Style.RESET_ALL)
    else:
        # Print out the results
        for status, count in status_counts.items():
            if status == "completed":
                print(Fore.GREEN)
            elif status == "failed":
                print(Fore.RED)
            else:
                print(Fore.YELLOW)

            print(f"------------ Status: {status} ------------")
            print(f"Count: {count}")
            for batch_name, batch_id in status_batches[status]:
                print(batch_name, batch_id)
            print(Style.RESET_ALL, end="")
        print(Fore.RED + "\nNOT ALL BATCHES COMPLETED" + Style.RESET_ALL)

    return all_completed
     
def retrieve_all_batch_responses(batch_statuses_json_path):
    with open(batch_statuses_json_path, "r") as file:
        batch_statuses_json = json.load(file)

    for batch in batch_statuses_json:
        batch_id = batch.get("batch_id")
        batch_file_path = retrieve_batch_api_responses(batch_id)
        merge_responses_into_json(batch_file_path, batch_id)








def retrieve_batch_api_responses(batch_id):
    # Create the subfolder if it doesn't exist
    subfolder = "batch_responses_jsonl_files"
    os.makedirs(subfolder, exist_ok=True)
    
    # Retrieve the batch status and file content
    batch_status = client.batches.retrieve(batch_id)
    file = client.files.content(batch_status.output_file_id)
    file_data_bytes = file.read()
    
    # Write the file data to a new file in the subfolder
    batch_file_path = os.path.join(subfolder, f"batch_output_{batch_id}.jsonl")
    with open(batch_file_path, "wb") as file:
        file.write(file_data_bytes)

    print(Fore.GREEN + f"Output file downloaded successfully to {batch_file_path}" + Style.RESET_ALL)
    return batch_file_path

def merge_responses_into_json(batch_file_path, batch_id):
    conditions = []
    
    with open(batch_file_path, "r") as file:
        for line in file:
            data = json.loads(line)
            response_body = data.get("response", {}).get("body", {})
            tool_calls = response_body.get("choices", [])[0].get("message", {}).get("tool_calls", [])
            for call in tool_calls:
                arguments = json.loads(call.get("function", {}).get("arguments", "{}"))
                conditions.extend(arguments.get("conditions", []))

    merged_conditions = {"conditions": conditions}
    
    # Create the subfolder if it doesn't exist
    subfolder = "condition_jsons"
    os.makedirs(subfolder, exist_ok=True)
    
    merged_file_path = os.path.join(subfolder, f"merged_conditions_{batch_id}.json")

    with open(merged_file_path, "w") as file:
        json.dump(merged_conditions, file, indent=4)

    print(Fore.GREEN + f"Merged conditions written to {merged_file_path}" + Style.RESET_ALL)

    return merged_conditions

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrieve batch API responses from OpenAI")
    parser.add_argument("batch_statuses_json", type=str, help="Batch statuses JSON file")
    args = parser.parse_args()

    print(Fore.CYAN + f"Reading batch statuses from {args.batch_statuses_json}" + Style.RESET_ALL)
    update_all_batch_statuses(args.batch_statuses_json)
    if (check_all_batch_completion(args.batch_statuses_json)):
        retrieve_all_batch_responses(args.batch_statuses_json)

        

    # batch_file_path = retrieve_batch_api_responses(args.batch_id)
    # merge_responses_into_json(batch_file_path, args.batch_id)