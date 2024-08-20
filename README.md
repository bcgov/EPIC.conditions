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


## Demo Presentation Slides
[Sharepoint](https://bcgov.sharepoint.com/:b:/t/04612/ERr2QDvCCa5ImPtp5_voevEB9SahnJKkNa0eWcfJVioIpg?e=cWr7Cn)