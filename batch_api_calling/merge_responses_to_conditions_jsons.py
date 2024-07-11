import json
import os
from colorama import Fore, Style
import argparse

def merge_responses_into_json(batch_file_path, batch_id):
    conditions = []
    
    with open(batch_file_path, "r") as file:
        for line in file:

            data = json.loads(line)

            response_body = data["response"]["body"]
            tool_calls = response_body["choices"][0]["message"]["tool_calls"]
            for call in tool_calls:
                arguments = json.loads(call["function"]["arguments"])
                conditions.extend(arguments["conditions"])


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

    length_error_files = []

    for jsonl_file_name in os.listdir(batch_responses_jsonl_files_path):

        jsonl_file_path = os.path.join(batch_responses_jsonl_files_path, jsonl_file_name)
        


        batch_id = "_".join(jsonl_file_name.split("_")[2:4]).split(".")[0]

        # Open BATCH_STATUSES.json and print the batch_name of the batch with the current batch_id
        with open("BATCH_STATUSES.json", "r") as f:
            batch_statuses_json = json.load(f)


        for batch in batch_statuses_json:
            if batch["batch_id"] == batch_id:
                status = batch["status"]
                batch_name = batch["batch_name"]

                if status == "length_error":
                    print(Fore.RED + f"Length error in {batch_name} {jsonl_file_name}" + Style.RESET_ALL)
                    length_error_files.append(batch_name)
                    break

                merge_responses_into_json(jsonl_file_path, batch_id)
                break

    if length_error_files:
        # Print all the files that have length errors
        print(Fore.RED + "\n------ SKIPPING FILES THAT HAVE LENGTH ERRORS ------" + Style.RESET_ALL)
        for file in length_error_files:
            print(Fore.RED + file + Style.RESET_ALL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge batch response jsonls into condition jsons")
    parser.add_argument("batch_responses_jsonl_files_path", type=str, help="Path to the folder containing batch response JSONL files")
    args = parser.parse_args()

    merge_all_into_json(args.batch_responses_jsonl_files_path)

