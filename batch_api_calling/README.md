
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
python send_batch_api_requests.py ./batch_requests_jsonl_files --output BATCH_STATUSES.json
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

<br>

**NOTE: During the retrieve_batch_api_responses.py step, it is possible to encounter length errors. These errors occur when a request exceeds the maximum allowed length for the GPT API. To handle these errors, follow the steps outlined below:**

### 3.1 `generate_all_batch_input_jsonls_length_fix.py`

**Description:**
Generates a batch JSONL file for each "chunk" that had a length error

**Usage:**
```
python generate_all_batch_input_jsonls_length_fix.py BATCH_STATUSES.json
```
**Output:**

Folder `/batch_requests_jsonl_files_length_fix` full of JSONL batch request files. Each JSONL corresponds to one "chunk" of requests that contained a length error stop reason

### 3.2 `send_batch_api_requests.py`

**Description:**
Sends all batches in the specified folder to the GPT API.

**Usage:**
```
python send_batch_api_requests.py ./batch_requests_jsonl_files_length_fix --output BATCH_STATUSES_LENGTH_FIX.json
```
**Output:**
BATCH_STATUSES_LENGTH_FIX.json

### 3.3 `retrieve_batch_api_responses.py`

**Description:**
Sends all batches in the specified folder to the GPT API.

**Usage:**
```
python retrieve_batch_api_responses.py ./BATCH_STATUSES_LENGTH_FIX.json --output ./batch_responses_jsonl_files_length_fix
```
**Output:**
Folder `/batch_responses_jsonl_files_length_fix` containing completed JSONL responses for each batch

### 3.4 `replace_length_errors.py`

**Description:**
Fixes all requests that returned a length error by replacing the failed responses with newly generated ones.

**Usage:**
```
python replace_length_errors.py ./batch_responses_jsonl_files_length_fix
```
**Output:**
All JSONLS with length errors in `batch_responses_jsonl_files` are overwritten or "patched" with fixed, newly generated responses

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
