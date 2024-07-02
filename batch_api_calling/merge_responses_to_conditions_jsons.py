import json
import os
from colorama import Fore, Style
import argparse

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


def merge_all_into_json(batch_responses_jsonl_files_path):

    for jsonl_file_name in os.listdir(batch_responses_jsonl_files_path):

        jsonl_file_path = os.path.join(batch_responses_jsonl_files_path, jsonl_file_name)

        # batch_output_batch_xaPFi8hGU7y9zthsZGB58aZs.jsonl
        batch_id = "_".join(jsonl_file_name.split("_")[2:4]).split(".")[0]

        merge_responses_into_json(jsonl_file_path, batch_id)


    # for batch in batch_statuses_json:
    #     batch_id = batch.get("batch_id")
    #     batch_file_path = os.path.join("batch_responses_jsonl_files", f"batch_responses_{batch_id}.jsonl")
    #     merge_responses_into_json(batch_file_path, batch_id)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge batch response jsonls into condition jsons")
    parser.add_argument("batch_responses_jsonl_files_path", type=str, help="Path to the folder containing batch response JSONL files")
    args = parser.parse_args()

    merge_all_into_json(args.batch_responses_jsonl_files_path)

