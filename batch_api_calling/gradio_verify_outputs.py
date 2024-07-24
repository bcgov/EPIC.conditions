import gradio as gr
import json
import os

# Define the paths to the folders
json_folder = './condition_jsons'
pdf_folder = '../test_documents/pdfs_for_batch_processing'

# Get the list of JSON files
json_files = sorted([f for f in os.listdir(json_folder) if f.endswith('.json')])

# Function to read a JSON file and return its content
def read_json(file_name):
    with open(os.path.join(json_folder, file_name), 'r') as file:
        return json.dumps(json.load(file), indent=4)

# Function to save the edited JSON content back to the file
def save_json(file_name, content):
    try:
        content_dict = json.loads(content)
        with open(os.path.join(json_folder, file_name), 'w') as file:
            json.dump(content_dict, file, indent=4)
        return "Save Successful", content_dict
    except json.JSONDecodeError as e:
        return "Invalid JSON Format: " + str(e), None

# Function to open the corresponding PDF file
def open_pdf(file_name):
    pdf_file = file_name.replace('.json', '.pdf')
    pdf_path = os.path.join(pdf_folder, pdf_file)
    os.startfile(pdf_path)  # This works on Windows

# Create the Gradio interface
with gr.Blocks() as demo:
    with gr.Tab("PDF to Text Converter"):
        file_dropdown = gr.Dropdown(label="Select JSON File", choices=json_files)
        open_pdf_button = gr.Button("Open Corresponding PDF")
        save_button = gr.Button("Save JSON")
        status_output = gr.Textbox(label="Status", lines=2, interactive=False)
        json_editor = gr.Textbox(label="JSON Content Editor", lines=20)
        json_viewer = gr.JSON(label="JSON Viewer")

        # Define the event to load and display JSON content
        def display_json(file_name):
            content = read_json(file_name)
            return content, json.loads(content)

        # Define the event to save the edited JSON content
        def handle_save_json(file_name, content):
            status, content_dict = save_json(file_name, content)
            if content_dict:
                return status, content_dict
            else:
                return status, gr.update()

        # Define the event to open the PDF file
        def handle_open_pdf(file_name):
            open_pdf(file_name)
            return gr.update()  # No change to the UI needed

        file_dropdown.change(display_json, inputs=file_dropdown, outputs=[json_editor, json_viewer])
        save_button.click(handle_save_json, inputs=[file_dropdown, json_editor], outputs=[status_output, json_viewer])
        open_pdf_button.click(handle_open_pdf, inputs=file_dropdown, outputs=[])

demo.launch()
