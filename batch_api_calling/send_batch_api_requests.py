import argparse
from openai import OpenAI
client = OpenAI()
import os
import json

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

    print("\nBatch created:")
    print(response)

    return response

def send_all_batches(jsonl_folder):
    jsonl_files = os.listdir(jsonl_folder)
    batches = []

    for jsonl_file in jsonl_files:

        jsonl_file_path = os.path.join(jsonl_folder, jsonl_file)
        response = send_batch_api_request(jsonl_file_path)

        batch = {
            "batch_name": jsonl_file,
            "batch_id": response.id,
            "status": "created"
        }

        batches.append(batch)

    with open("BATCH_STATUSES.json", "w") as f:
        f.write(json.dumps(batches, indent=4))

def check_batch_queue_limit():
    # TO DO: make function that checks if the batch queue is full. If space, continue adding the next batch. If full, wait until space is available and then add the next batch.
    return

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send multiple batch API requests to OpenAI")
    parser.add_argument("jsonl_folder", type=str, help="Path to the folder containing JSONL files")
    args = parser.parse_args()

    send_all_batches(args.jsonl_folder)

    # send_batch_api_request(args.jsonl_file)