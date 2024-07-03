import argparse
import json
import os



def fix_all_length_errors(batch_statuses_json):
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

                        # # Extract the start and end conditions from the custom_id e.g. request_1-5
                        # start_condition = int(line_json["custom_id"].split("_")[1].split("-")[0])
                        # end_condition = int(line_json["custom_id"].split("_")[1].split("-")[1])

                        # # Remove .jsonl from the batch name and add .pdf
                        # pdf_name = batch["batch_name"].replace(".jsonl", ".pdf")
                        # print("PDF NAME: " + pdf_name)




if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix length errors in batch responses")
    parser.add_argument("batch_statuses_json", type=str, help="Path to the JSON file containing batch statuses")
    args = parser.parse_args()

    fix_all_length_errors(args.batch_statuses_json)
