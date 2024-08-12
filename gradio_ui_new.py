import gradio as gr
from gpt import compare_documents, extract_info, count_conditions, extract_all_conditions, extract_all_subconditions, extract_subcondition
from batch_api_calling.extract_management_plans import extract_management_plan_info_from_json

import json
import os

import read_pdf

def save_json_locally(json_data, input_filename):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]
    output_filename = f"{base_name}.json"
    with open(output_filename, 'w') as f:
        json.dump(json_data, f, indent=4)
    return {"message": f"File saved as {output_filename}"}, json.dumps(json_data, indent=4), json_data

def display_json(input_filename):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]
    json_filename = f"{base_name}.json"
    try:
        with open(json_filename, "r") as file:
            content = file.read()
        return content, json.loads(content)
    except FileNotFoundError:
        return "", {}

def handle_save_json(content, input_filename):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]
    json_filename = f"{base_name}.json"
    try:
        with open(json_filename, "w") as file:
            json.dump(json.loads(content), file, indent=4)
        status = "Save Successful"
        content_dict = json.loads(content)
    except Exception as e:
        status = f"Save Failed: {str(e)}"
        content_dict = None
    return status, content_dict

with gr.Blocks(theme=gr.themes.Soft()) as app:

    file_input = gr.File(label="File Input")
    
    with gr.Tab("Condition Extractor"):


        with gr.Row():
            count_conditions_button = gr.Button("Count Conditions")
            number_of_conditions = gr.Number(label="Number of Conditions", precision=0, value=0)
            count_conditions_button.click(
                fn=count_conditions,
                inputs=file_input,
                outputs=number_of_conditions
            )

        with gr.Column():
                submit_button = gr.Button("Submit")
                merged_chunks = gr.JSON(label="Merged Chunks")
                extract_deliverables_button = gr.Button("Extract Deliverables")
                deliverables = gr.JSON(label="Extracted Deliverables")
                extract_subconditions_button = gr.Button("Extract Subconditions")
                subconditions = gr.JSON(label="Extracted Subconditions")
                
    with gr.Tab("JSON Editor"):
        save_button = gr.Button("Save Changes 💾")
        status_output = gr.Textbox(label="Save Status", lines=1, interactive=False)

        with gr.Row():
            json_editor = gr.Textbox(label="JSON Content Editor", lines=300, max_lines=9999)
            json_viewer = gr.JSON(label="JSON Viewer")

    # Set up the submit button click event
    submit_button.click(
        fn=extract_all_conditions,
        inputs=[file_input, number_of_conditions],
        outputs=[merged_chunks]
    ).then(
        fn=extract_management_plan_info_from_json,
        inputs=[merged_chunks],
        outputs=[deliverables]
    ).then(
        fn=extract_all_subconditions,
        inputs=[deliverables],
        outputs=[subconditions]
    ).then(
        fn=save_json_locally,
        inputs=[subconditions, file_input],
        outputs=[status_output, json_editor, json_viewer]
    )

    # Load and display the JSON content when a file is uploaded
    file_input.change(
        fn=display_json,
        inputs=[file_input],
        outputs=[json_editor, json_viewer]
    )

    # Set up the save button click event
    save_button.click(
        fn=handle_save_json,
        inputs=[json_editor, file_input],
        outputs=[status_output, json_viewer]
    )

app.launch(server_name="0.0.0.0", server_port=7860)