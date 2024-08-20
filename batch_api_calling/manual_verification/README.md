# Manual Verification UI

## Usage

### Start Gradio UI

1. Add all PDFs to `/pdfs`
2. Add all corresponding JSONS to /condition_jsons_to_verify
3. Run `python gradio_verify_outputs.py`
4. Navigate to *http://127.0.0.1:7862/*

### Use Gradio UI
1. Run `python generate_verification_status_json.py` to generate *VERIFICATION_STATUSES.json*. It contains an entry for each JSON and whether or not it has been flagged as verified.
2. Select a JSON from the dropdown
3. Use **◀️ Previous** and **Next ▶️** buttons  to cycle between JSONs
4. Click **Open Corresponding PDF 🗎** to open corresponding PDF
5. Check if JSON output was extracted correctly. If not, make changes in the JSON Content Editor and click **Save Changes 💾**. This will overwrite the JSON file's contents with your changes. 
6. Once everything is correct and verified, click **Flag as Verified ✅**
7. Verify all of the files. Good luck!

