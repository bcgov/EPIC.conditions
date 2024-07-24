import gradio as gr
import json
import os

# Define the paths to the folders and verification status file
json_folder = './condition_jsons'
pdf_folder = '../test_documents/pdfs_for_batch_processing'
verification_status_file = 'VERIFICATION_STATUSES.json'

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

# Function to read the verification statuses
def read_verification_statuses():
    if os.path.exists(verification_status_file):
        with open(verification_status_file, 'r') as file:
            return json.load(file)
    else:
        return {}

# Function to save the verification statuses
def save_verification_statuses(statuses):
    with open(verification_status_file, 'w') as file:
        json.dump(statuses, file, indent=4)

# Function to flag a JSON file as verified
def flag_as_verified(file_name):
    statuses = read_verification_statuses()
    statuses[file_name] = {"verified_by_human": True}
    save_verification_statuses(statuses)
    return "Verified", statuses[file_name]

# Function to get the verification status of a JSON file
def get_verification_status(file_name):
    statuses = read_verification_statuses()
    if file_name in statuses:
        return statuses[file_name]
    else:
        return {"verified_by_human": False}

# Function to format the verification status as HTML
def format_verification_status(verified):
    if verified["verified_by_human"]:
        return '<span style="color: green;">✅ Verified</span>'
    else:
        return '<span style="color: red;">❌ Not Verified</span>'

# Create the Gradio interface
with gr.Blocks() as demo:
    with gr.Tab("PDF to Text Converter"):
        file_dropdown = gr.Dropdown(label="Select JSON File", choices=json_files)
        open_pdf_button = gr.Button("Open Corresponding PDF 🗎")

        with gr.Row():
            save_button = gr.Button("Save Changes 💾")
            flag_verified_button = gr.Button("Flag as Verified ✅")

        verification_status_output = gr.HTML()
        status_output = gr.Textbox(label="Status", lines=2, interactive=False)
        json_editor = gr.Textbox(label="JSON Content Editor", lines=20)
        json_viewer = gr.JSON(label="JSON Viewer")

        # Define the event to load and display JSON content
        def display_json(file_name):
            content = read_json(file_name)
            verification_status = get_verification_status(file_name)
            verification_status_html = format_verification_status(verification_status)
            return content, json.loads(content), verification_status_html

        # Define the event to save the edited JSON content
        def handle_save_json(file_name, content):
            status, content_dict = save_json(file_name, content)
            if content_dict:
                verification_status = get_verification_status(file_name)
                verification_status_html = format_verification_status(verification_status)
                return status, content_dict, verification_status_html
            else:
                return status, gr.update(), gr.update()

        # Define the event to open the PDF file
        def handle_open_pdf(file_name):
            open_pdf(file_name)
            return gr.update()  # No change to the UI needed

        # Define the event to flag the JSON file as verified
        def handle_flag_verified(file_name):
            status, verification_status = flag_as_verified(file_name)
            verification_status_html = format_verification_status(verification_status)
            return status, verification_status_html

        file_dropdown.change(display_json, inputs=file_dropdown, outputs=[json_editor, json_viewer, verification_status_output])
        save_button.click(handle_save_json, inputs=[file_dropdown, json_editor], outputs=[status_output, json_viewer, verification_status_output])
        open_pdf_button.click(handle_open_pdf, inputs=file_dropdown, outputs=[])
        flag_verified_button.click(handle_flag_verified, inputs=file_dropdown, outputs=[status_output, verification_status_output])

demo.launch()
