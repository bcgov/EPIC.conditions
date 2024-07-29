# Batch Processing
This guide provides step-by-step instructions for extracting conditions from a large number of PDFs using the OpenAI API. The process involves several stages, from counting the conditions in each PDF to generating, sending, and retrieving API requests, and finally merging the responses into formatted JSON files. Below are the steps you need to follow to complete the batch processing:

## 0.
Start by adding any PDF files you want to extract conditions from to /test_documents/pdfs_for_batch_processing. Also extract all_docs_info.zip so that everything.json is in /batch_api_calling. Next, paste in and run the following scripts one by one:

## 1.
```
python generate_condition_count_json.py ../test_documents/pdfs_for_batch_processing
```
**Description:**
Uses the GPT API to count how many conditions are in each PDF in the provided folder<br>
**Output:**
CONDITION_COUNT.json

<br>

**NOTE 1: You may run into rate limits that causes the script to exit before counting all the conditions in every file. Simply wait a few minutes and run the script again to have it continue where it left off. (It will skip any PDFs that had their conditions already counted)**

**NOTE 2: Once you run this, you should verify if the number of conditions were counted correctly for each PDF by checking CONDITION_COUNT.json**

## 2.
```
python generate_all_batch_input_jsonls.py CONDITION_COUNT.json
```
**Description:**
Generates a batch JSONL file for each PDF in preparation to send to the GPT API.<br>
**Output:**
Folder `/batch_requests_jsonl_files` full of JSONL batch request files.

## 3.
```
python send_batch_api_requests.py ./batch_requests_jsonl_files --output BATCH_STATUSES.json
```
**Description:**
Sends all batches in the specified folder to the GPT API.<br>
**Output:**
BATCH_STATUSES.json

## 4.
```
python retrieve_batch_api_responses.py BATCH_STATUSES.json
```
**Description:**
Attempts to retrieve and download all batches.<br>
**Output:**
Folder `/batch_responses_jsonl_files` containing completed JSONL responses for each batch

<br>

**NOTE: During the retrieve_batch_api_responses.py step, it is possible to encounter length errors. These errors occur when a request exceeds the maximum allowed length for the GPT API. To handle these errors, follow the steps outlined below:**

### 4.1
```
python generate_all_batch_input_jsonls_length_fix.py BATCH_STATUSES.json
```
**Description:**
Generates a batch JSONL file for each "chunk" that had a length error.<br>
**Output:**
Folder `/batch_requests_jsonl_files_length_fix` full of JSONL batch request files. Each JSONL corresponds to one "chunk" of requests that contained a length error stop reason

### 4.2
**Description:**
```
python send_batch_api_requests.py ./batch_requests_jsonl_files_length_fix --output BATCH_STATUSES_LENGTH_FIX.json
```
Sends all batches in the specified folder to the GPT API.<br>
**Output:**
BATCH_STATUSES_LENGTH_FIX.json

### 4.3
```
python retrieve_batch_api_responses.py ./BATCH_STATUSES_LENGTH_FIX.json --output ./batch_responses_jsonl_files_length_fix
```
**Description:**
Sends all batches in the specified folder to the GPT API.<br>
**Output:**
Folder `/batch_responses_jsonl_files_length_fix` containing completed JSONL responses for each batch

### 4.4
```
python replace_length_errors.py ./batch_responses_jsonl_files_length_fix
```
**Description:**
Fixes all requests that returned a length error by replacing the failed responses with newly generated ones.<br>
**Output:**
All JSONLS with length errors in `batch_responses_jsonl_files` are overwritten or "patched" with fixed, newly generated responses

## 5.
```
python merge_responses_to_conditions_jsons.py ./batch_responses_jsonl_files
```
**Description:**
Parses all batch response JSONLs in ./batch_responses_jsonl_files and merges each batch response into a formatted JSON. Also looks up file metadata from everything.json and adds it to each of the final merged JSONs.<br>
**Output:**
Folder `/condition_jsons` containing a JSON with extracted conditions for each PDF

## 6.
```
python extract_management_plans.py --jsons_folder_path ./condition_jsons --output_folder_path ./condition_jsons_with_management_plans
```

**Description:**
Detects conditions that require a management plan and extracts the management plan information from each JSON in the specified input folder. Saves new JSONs with extracted management plan info to the output folder.<br>
**Output:**
Folder `/condition_jsons_with_management_plans` containing updated JSONs with extracted management plan information.

**NOTE 1: You may run into rate limits that causes the script to exit before extracting the management plan info in every file. Simply wait a few minutes and run the script again to have it continue where it left off. (It will skip any JSONs that had their management plan info extracted)**

# Extras
```
python clean_workspace.py
```
**Description:**
Deletes all JSONs/JSONLs involved in batch processing process.

