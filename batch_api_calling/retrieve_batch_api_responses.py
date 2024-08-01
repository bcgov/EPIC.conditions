from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()
import argparse
import json
from collections import defaultdict
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        print(Fore.GREEN + "\n--------------- ALL BATCHES COMPLETED ---------------\n" + Style.RESET_ALL)
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
     
def retrieve_all_batch_responses(batch_statuses_json_path, output_folder):
    with open(batch_statuses_json_path, "r") as file:
        batch_statuses_json = json.load(file)

    for batch in batch_statuses_json:
        batch_id = batch.get("batch_id")
        batch_file_path = retrieve_batch_api_responses(batch_id, output_folder)
        # merge_responses_into_json(batch_file_path, batch_id)

def check_for_chunk_length_error(batch_responses_jsonl_files_path):

    for jsonl_file in os.listdir(batch_responses_jsonl_files_path):

        jsonl_file_path = os.path.join(batch_responses_jsonl_files_path, jsonl_file)

        with open(jsonl_file_path, 'r') as file:
            for line in file:
                response = json.loads(line)
                finish_reason = response['response']['body']['choices'][0]['finish_reason']
                
                if finish_reason != "stop":

                    if finish_reason == "length":
                        print(Fore.RED + f"finish_reason length error in {jsonl_file}" + Style.RESET_ALL)
                        
                        # Update BATCH_STATUSES.json, change status to length_error
                        with open("BATCH_STATUSES.json", "r") as f:
                            batch_statuses_json = json.load(f)

                        current_batch_id = "_".join(jsonl_file.split("_")[2:4]).split(".")[0]

                        # find the batch in the json file
                        for batch in batch_statuses_json:
                            if batch.get("batch_id") == current_batch_id:
                                batch["status"] = "length_error"
                                break

                        with open("BATCH_STATUSES.json", "w") as f:
                            json.dump(batch_statuses_json, f, indent=4)
                            
                        
                        
                        return True
                    else:
                        print(Fore.RED + f"finish_reason {finish_reason} error in {jsonl_file}" + Style.RESET_ALL)
                
    print(Fore.GREEN + "No finish_reason length errors found" + Style.RESET_ALL)
    return False

def retrieve_batch_api_responses(batch_id, output_folder):
    # Create the subfolder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Retrieve the batch status and file content
    batch_status = client.batches.retrieve(batch_id)
    file = client.files.content(batch_status.output_file_id)
    file_data_bytes = file.read()
    
    # Write the file data to a new file in the output_folder
    batch_file_path = os.path.join(output_folder, f"batch_output_{batch_id}.jsonl")
    with open(batch_file_path, "wb") as file:
        file.write(file_data_bytes)

    print(Fore.GREEN + f"Output file downloaded successfully to {batch_file_path}" + Style.RESET_ALL)
    return batch_file_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrieve batch API responses from OpenAI")
    parser.add_argument(
        "batch_statuses_json", 
        type=str, 
        nargs='?',
        default="./BATCH_STATUSES.json", 
        help="Batch statuses JSON file"
    )
    
    # Optional output folder argument
    parser.add_argument(
        "--output", 
        type=str, 
        default="batch_responses_jsonl_files", 
        help="Name of the output folder"
    )
    args = parser.parse_args()


    print(Fore.CYAN + f"Checking batch statuses from {args.batch_statuses_json}" + Style.RESET_ALL)
    update_all_batch_statuses(args.batch_statuses_json)
    if (check_all_batch_completion(args.batch_statuses_json)):
        retrieve_all_batch_responses(args.batch_statuses_json, args.output)
        check_for_chunk_length_error("./batch_responses_jsonl_files")