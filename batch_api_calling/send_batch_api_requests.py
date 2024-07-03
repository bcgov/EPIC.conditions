import argparse
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
import os
import json
import time
from colorama import Fore, Style

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from retrieve_batch_api_responses import retrieve_batch_status

def send_batch_api_request(jsonl_file_path):
    batch_input_file = client.files.create(
        file=open(jsonl_file_path, "rb"),
        purpose="batch"
    )

    batch_input_file_id = batch_input_file.id

    response = client.batches.create(
        input_file_id=batch_input_file_id,
        endpoint="/v1/chat/completions",
        completion_window="24h",
        metadata={
            "description": f"Batch for {jsonl_file_path}",
        }
    )

    print(Fore.GREEN + "\nBatch created:" + Style.RESET_ALL)
    print(response)

    return response

def send_all_batches(jsonl_folder, output_filename):
    jsonl_files = os.listdir(jsonl_folder)
    batches = []

    for jsonl_file in jsonl_files:
        jsonl_file_path = os.path.join(jsonl_folder, jsonl_file)
        attempt = 0

        while True:
            response = send_batch_api_request(jsonl_file_path)
            batch_status = retrieve_batch_status(response.id)

            while batch_status == "validating":
                print(Fore.YELLOW + f"Batch {jsonl_file} is still validating..." + Style.RESET_ALL)
                time.sleep(2)  # Wait for 2 seconds before checking again
                batch_status = retrieve_batch_status(response.id)

            if batch_status == "failed":
                wait_time = 2 ** attempt  # Exponential backoff
                print(Fore.RED + f"Batch {jsonl_file} failed. waiting for {wait_time} seconds before retrying..." + Style.RESET_ALL)
                time.sleep(wait_time)
                attempt += 1
            else:
                break

        batch = {
            "batch_name": jsonl_file,
            "batch_id": response.id,
            "status": batch_status
        }

        batches.append(batch)
        print(Fore.CYAN + f"Batch {jsonl_file} status: {batch_status}" + Style.RESET_ALL)

    with open(output_filename, "w") as f:
        f.write(json.dumps(batches, indent=4))

        print(Fore.GREEN + "\nAll batches in progress or completed (BATCH_STATUSES.json)" + Style.RESET_ALL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send multiple batch API requests to OpenAI")
    parser.add_argument("jsonl_folder", type=str, help="Path to the folder containing JSONL files")
    
    # Optional output file name argument
    parser.add_argument("--output", type=str, default="BATCH_STATUSES.json", help="Name of the output JSON file")
    
    args = parser.parse_args()
    

    send_all_batches(args.jsonl_folder, args.output)

    # send_batch_api_request(args.jsonl_file)
