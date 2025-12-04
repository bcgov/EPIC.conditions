# CONDITION-PARSER

Gradio application for extracting conditions and related details from PDF documents.

## Getting Started

## Step 1. Clone the repository:
   
    - `git clone https://github.com/bcgov/EPIC.conditions`

    - `cd condition-parser`
   

## Step 2. Set up a virtual environment:
   
    - `python -m venv venv`

## Step 3. Activate the virtual environment:
   - On Windows:
   
        `venv\Scripts\activate`
   - On Linux/MacOS:
   
        `source venv/bin/activate`

## Step 4. Install the required packages:
   
    - `pip install -r requirements.txt`

## Step 5. Create a file named `.env` in the root directory of the project and add your OpenAI API key:
   ```text
   OPENAI_API_KEY=openai_api_key_here
   ```

## Step 6. Run the gradio UI by executing the following command in the root of the directory (/condition-parser):

    - `python gradio_ui.py`
