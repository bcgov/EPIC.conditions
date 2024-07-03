import argparse
import json
import os

from generate_all_batch_input_jsonls import generate_batch_input_jsonl

def generate_all_batch_input_jsonls_length_fix(batch_statuses_json):
    with open(batch_statuses_json, "r") as f:
        batch_statuses_json = json.load(f)

    for batch in batch_statuses_json:
        if batch.get("status") == "length_error":
            print(f"Fixing length error for {batch.get('batch_name')}")

            batch_id = batch.get("batch_id")
            batch_file_path = f"batch_responses_jsonl_files/batch_output_{batch_id}.jsonl"

            with open(batch_file_path, "r") as file:
                for line in file:
                    line_json = json.loads(line)
                    finish_reason = line_json['response']['body']['choices'][0]['finish_reason']

                    if finish_reason == "length":
                        print("Length error found!!!!!!!")
                        print("BATCH ID: "+ batch["batch_id"])
                        print("REQUEST ID: " + line_json["id"])

                        print(line_json["custom_id"])

                        # Extract the start and end conditions from the custom_id e.g. request_1-5
                        start_condition = int(line_json["custom_id"].split("_")[1].split("-")[0])
                        end_condition = int(line_json["custom_id"].split("_")[1].split("-")[1])

                        # Remove .jsonl from the batch name and add .pdf
                        pdf_name = batch["batch_name"].replace(".jsonl", ".pdf")
                        print("PDF NAME: " + pdf_name)


                        pdf_path = f"../test_documents/schedule_b_pdfs/{pdf_name}"

                        # create subfolder if it doesn't exist
                        output_folder = "LENGTH_ERROR_batch_requests_jsonl_files"
                        os.makedirs(output_folder, exist_ok=True)

                        # Generate new batch input JSONL file, extracting conditions individually
                        generate_batch_input_jsonl(pdf_path, 999, f"./{output_folder}/{line_json["custom_id"]}_{batch["batch_name"]}", 1, start_condition, end_condition)


                        # Fix the length error
                        # Update the batch_statuses_json
                        # batch["status"] = "completed"


    print("All length errors fixed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix all requests that returned a length error in the batch API calls")
    parser.add_argument("batch_statuses_json", type=str, help="Batch statuses JSON file")
    args = parser.parse_args()

    generate_all_batch_input_jsonls_length_fix(args.batch_statuses_json)
