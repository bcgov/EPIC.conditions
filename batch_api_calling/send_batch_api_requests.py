import argparse
from openai import OpenAI
client = OpenAI()

def send_batch_api_requests(jsonl_file_path):
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
            "description": "Condition extractor batch API request.",
        }
    )

    print("\nBatch created:")
    print(response)

    return response

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Send batch API requests to OpenAI")
    parser.add_argument("jsonl_file", type=str, help="Path to the JSONL file")
    args = parser.parse_args()

    send_batch_api_requests(args.jsonl_file)