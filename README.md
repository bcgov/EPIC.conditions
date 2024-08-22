## Installation

1. Clone the repository:
   
   `git clone https://github.com/bcgov/EPIC.conditions`

   `cd EPIC.conditions`
   

2. Set up a virtual environment:
   
    `python -m venv venv`

3. Activate the virtual environment:
   - On Windows:
   
        `venv\Scripts\activate`
   - On Linux/MacOS:
   
        `source venv/bin/activate`

4. Install the required packages:
   
    `pip install -r requirements.txt`

5. Create a file named `.env` in the root directory of the project and add your OpenAI API key:
   ```text
   OPENAI_API_KEY=openai_api_key_here
   ```

## Usage

### Individual PDFs:

Follow the [condition-parser README](./condition-parser) to extract info and get a JSON.

Follow the [condition-lib README](./condition-lib) to add the extracted JSON to the PostgreSQL database.

*Note: gradio_ui.py in this directory is depreciated.* 

### Multiple PDFs (Batch Processing):

See [batch processing README](./batch_api_calling).

For verifying the output of a batch, see [manual verification README](./batch_api_calling/manual_verification/).


## Demo
[![Condition extractor demo](https://github.com/user-attachments/assets/a25b0093-b04b-4ddb-89cd-153ddaa582cd)](https://bcgov.sharepoint.com/:b:/t/04612/EYzyqtlP82BJt8ocy2AISNwBwiS-2BgJ23NqRZts-Nn6jw?e=CM1Nt3)
[Recording]() - [(Slides)](https://bcgov.sharepoint.com/:b:/t/04612/EYzyqtlP82BJt8ocy2AISNwBwiS-2BgJ23NqRZts-Nn6jw?e=CM1Nt3)

## Resources
- [AI crashcourse presentation](https://bcgov.sharepoint.com/:v:/t/04612/EX_-99Ne-IJPlyOr09vqRZgBCvCGLNEmWr5baMlF5VgraQ?e=Xw8rB2) - [(Slides)](https://bcgov.sharepoint.com/:b:/t/04612/EdJII7T6wfJCl3xOS9ANGKYB0w8oYdEgroBIoOVZPMmCNg?e=K0W55d)
- [Sample output JSONs (August 2024)](https://bcgov.sharepoint.com/:f:/t/04612/EnKdD_vryA5JrSXxcloZUi8BQzcUhJjHAK4pDeGy1PuK2w?e=n4cJ5l)
- [API cost analysis (out of date)](https://bcgov.sharepoint.com/:x:/t/04612/ETA885_P64BBhUWoGvWHT_ABuYQZC2jjLCC-q8zGOr4MeA?e=WG5ZeX)

- [OpenAI function calling documentation](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI API reference](https://platform.openai.com/docs/api-reference/chat)[.](https://github.com/user-attachments/assets/cac337de-097d-4bfb-b946-56b98a2f1e1d)

