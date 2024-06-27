from openai import OpenAI
client = OpenAI()
import argparse
import json

from colorama import Fore, Back, Style

def retrieve_batch_api_responses(batch_id):
    batch_status = client.batches.retrieve(batch_id)
    
    print(Fore.CYAN + "\nBatch status:" + Style.RESET_ALL)
    print(batch_status)
    
    # Check if all requests succeeded
    if batch_status.request_counts.completed == batch_status.request_counts.total:
        print(Fore.GREEN + "All batch requests succeeded." + Style.RESET_ALL)
        
        print(Fore.CYAN + "Output file ID: " + Style.RESET_ALL + str(batch_status.output_file_id))
        print(Fore.CYAN + "Downloading output file..." + Style.RESET_ALL)
        
        file = client.files.content(batch_status.output_file_id)
        file_data_bytes = file.read()
        
        # Write the file data to a new file
        batch_file_path = f"batch_output_{batch_id}.jsonl"
        with open(batch_file_path, "wb") as file:
            file.write(file_data_bytes)

        print(Fore.GREEN + f"Output file downloaded successfully to {batch_file_path}" + Style.RESET_ALL)
        return batch_file_path

    else:
        print(Fore.RED + f"Batch requests not fully completed. Completed: {batch_status.request_counts.completed}, Failed: {batch_status.request_counts.failed}, Total: {batch_status.request_counts.total}" + Style.RESET_ALL)

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
    merged_file_path = f"merged_conditions_{batch_id}.json"

    with open(merged_file_path, "w") as file:
        json.dump(merged_conditions, file, indent=4)

    print(Fore.GREEN + f"Merged conditions written to {merged_file_path}" + Style.RESET_ALL)

    return merged_conditions


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Retrieve batch API responses from OpenAI")
    parser.add_argument("batch_id", type=str, help="Batch ID")
    args = parser.parse_args()

    batch_file_path = retrieve_batch_api_responses(args.batch_id)
    merge_responses_into_json(batch_file_path, args.batch_id)
