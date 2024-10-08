import json
import os
from colorama import Fore, Style
import argparse

def lookup_metadata_from_doc_name(document_name, everything_json):
    # Load the everything.json file
    with open(everything_json, "r") as f:
        everything = json.load(f)

    # Loop through the everything.json file
    for project in everything:
        document_id_from_big_json = project["_id"]

        if document_id_from_big_json == document_name:
            project_id = project["project"]
            display_name = project["displayName"]
            document_file_name = project["documentFileName"]
            document_id = project["_id"]
            date_issued = project["datePosted"]
            act = project["legislation"]

            print(Fore.GREEN + f"Project ID: {Fore.CYAN}{project_id}{Style.RESET_ALL}")
            print(Fore.GREEN + f"Display Name: {Fore.CYAN}{display_name}{Style.RESET_ALL}")
            print(Fore.GREEN + f"Document File Name: {Fore.CYAN}{document_file_name}{Style.RESET_ALL}")
            print(Fore.GREEN + f"Document ID: {Fore.CYAN}{document_id}{Style.RESET_ALL}")
            print(Fore.GREEN + f"Date Issued: {Fore.CYAN}{date_issued}{Style.RESET_ALL}")
            print(Fore.GREEN + f"Act: {Fore.CYAN}{act}{Style.RESET_ALL}")

            return project_id, display_name, document_file_name, document_id, date_issued, act

    print(Fore.RED + "Document ID not found in everything.json" + Style.RESET_ALL)

    return None, None, None, None, None, None

def get_info_from_batch_id(batch_id, batch_statuses_json, missing_docs):
    with open(batch_statuses_json, "r") as f:
        batch_statuses_json = json.load(f)

    for batch in batch_statuses_json:
        if batch["batch_id"] == batch_id:
            print(Fore.GREEN + f"Batch ID: {Fore.CYAN}{batch['batch_id']}{Style.RESET_ALL}")
            batch_name = batch["batch_name"]
            print(Fore.GREEN + f"Batch Name: {Fore.CYAN}{batch_name}{Style.RESET_ALL}")
            document_name = "_".join(batch_name.split("_")[1:])
            document_name = document_name.replace(".jsonl", "")
            print(Fore.GREEN + f"Document ID: {Fore.CYAN}{document_name}{Style.RESET_ALL}")

            project_id, display_name, document_file_name, document_id, date_issued, act = lookup_metadata_from_doc_name(document_name, "everything.json")

            if display_name is None:
                missing_docs.append(batch_name)

            return project_id, display_name, document_file_name, document_id, date_issued, act, batch_name
    return None, None, None, None, None, None, None

def merge_responses_into_json(batch_file_path, batch_id, missing_docs, batch_name):
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

    project_id, display_name, document_file_name, document_id, date_issued, act, _ = get_info_from_batch_id(batch_id, "BATCH_STATUSES.json", missing_docs)

    merged_conditions["project_id"] = project_id
    merged_conditions["document_id"] = document_id
    merged_conditions["display_name"] = display_name
    merged_conditions["document_file_name"] = document_file_name
    merged_conditions["date_issued"] = date_issued
    merged_conditions["act"] = act

    # Create the subfolder if it doesn't exist
    subfolder = "condition_jsons"
    os.makedirs(subfolder, exist_ok=True)

    # Determine the merged file path
    if project_id and document_id:
        merged_file_path = os.path.join(subfolder, f"{project_id}_{document_id}.json")
    else:
        pdf_file_name = batch_name.replace(".jsonl", ".json")
        merged_file_path = os.path.join(subfolder, pdf_file_name)

    with open(merged_file_path, "w") as file:
        json.dump(merged_conditions, file, indent=4)

    print(Fore.GREEN + f"Merged conditions written to {merged_file_path}\n" + Style.RESET_ALL)

    return merged_conditions

def merge_all_into_json(batch_responses_jsonl_files_path):
    length_error_files = []
    missing_docs = []

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

                merge_responses_into_json(jsonl_file_path, batch_id, missing_docs, batch_name)
                break

    if length_error_files:
        # Print all the files that have length errors
        print(Fore.RED + "\n------ SKIPPING FILES THAT HAVE LENGTH ERRORS ------" + Style.RESET_ALL)
        for file in length_error_files:
            print(Fore.RED + file + Style.RESET_ALL)

    if missing_docs:
        # Print all the files where the document was not found
        print(Fore.RED + "\n------ FILES WHERE DOCUMENT ID WAS NOT FOUND ------" + Style.RESET_ALL)
        for doc in missing_docs:
            print(Fore.RED + doc + Style.RESET_ALL)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge batch response JSONLs into condition JSONs")
    parser.add_argument(
        "batch_responses_jsonl_files_path", 
        type=str, 
        nargs='?',
        default="./batch_responses_jsonl_files", 
        help="Path to the folder containing batch response JSONL files"
    )
    args = parser.parse_args()

    merge_all_into_json(args.batch_responses_jsonl_files_path)