import argparse
from openai import OpenAI
client = OpenAI()
import os
import json
import time


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

    print("\nBatch created:")
    print(response)

    return response

def send_all_batches(jsonl_folder):
    jsonl_files = os.listdir(jsonl_folder)
    batches = []

    for jsonl_file in jsonl_files:

        jsonl_file_path = os.path.join(jsonl_folder, jsonl_file)

        while True:
            response = send_batch_api_request(jsonl_file_path)
            batch_status = retrieve_batch_status(response.id)

            while batch_status == "validating":
                print(f"Batch {jsonl_file} is still validating...")
                time.sleep(2)  # Wait for 2 seconds before checking again
                batch_status = retrieve_batch_status(response.id)

            if batch_status == "failed":
                print(f"Batch {jsonl_file} failed. waiting for 5 seconds before retrying...")
                time.sleep(5)
            else:
                break


        batch = {
            "batch_name": jsonl_file,
            "batch_id": response.id,
            "status": batch_status
        }

        batches.append(batch)
        print(f"Batch {jsonl_file} status: {batch_status}")

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