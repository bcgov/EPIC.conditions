
## Batch API Calling Overview

## 0. `generate_condition_count_json.py`

**Description:**
Uses the GPT API to count how many conditions are in each PDF in the provided folder

**Usage:**
```
python generate_condition_count_json.py <path_to_folder_with_pdfs>
```
**Output:**
CONDITION_COUNT.json

---

## 1. `generate_all_batch_input_jsonls.py`

**Description:**
Generates a batch JSONL file for each PDF in preparation to send to the GPT API.

**Usage:**
```
python generate_all_batch_input_jsonls.py CONDITION_COUNT.json
```
**Output:**
Folder `/batch_requests_jsonl_files` full of JSONL batch request files.

---

## 2. `send_batch_api_requests.py`

**Description:**
Sends all batches in the specified folder to the GPT API.

**Usage:**
```
python send_batch_api_requests.py <path_to_folder_with_request_jsonls> --output BATCH_STATUSES.json
```
**Output:**
BATCH_STATUSES.json

---
## 3. `retrieve_batch_api_responses.py`

**Description:**
Attempts to retrieve and download all batches.

**Usage:**
```
python retrieve_batch_api_responses.py BATCH_STATUSES.json
```
**Output:**

Folder `/batch_responses_jsonl_files` containing completed JSONL responses for each batch

---
## 4. `merge_responses_to_conditions_jsons.py`

**Description:**
Parses all batch response JSONLs in ./batch_responses_jsonl_files and merges each batch response into a formatted JSON

**Usage:**
```
python merge_responses_to_conditions_jsons.py ./batch_responses_jsonl_files
```
**Output:**

Folder `/condition_jsons` containing a JSON with extracted conditions for each PDF
