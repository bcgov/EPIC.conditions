import gradio as gr
from gpt import classify_and_count, extract_and_enrich_all
from extract_first_nations import process_single_pdf

import json
import os


OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "condition-loader", "condition_jsons")


def format_classification(classification):
    """Format classification dict into a human-readable string for the UI."""
    if not classification:
        return "Classification failed"
    doc_type = classification.get("document_type", "unknown")
    has_numbered = classification.get("has_numbered_conditions", False)
    headers = classification.get("section_headers", [])
    count = classification.get("estimated_item_count", 0)

    lines = [
        f"Document type: {doc_type}",
        f"Has numbered conditions: {has_numbered}",
        f"Estimated item count: {count}",
    ]
    if headers:
        lines.append(f"Section headers: {', '.join(headers)}")
    return "\n".join(lines)


def classify_document_ui(file_input):
    """Classify the document and return both the classification dict and a display string."""
    classification = classify_and_count(file_input)
    display_text = format_classification(classification)
    return classification, display_text


def extract_and_enrich_ui(file_input, classification):
    """Run the full extraction + enrichment pipeline."""
    if not classification:
        return {"error": "Please classify the document first."}
    result = extract_and_enrich_all(file_input, classification)
    return result


def add_first_nations_ui(file_input, enriched_json):
    """Add first nations info to the enriched JSON."""
    if not enriched_json or "conditions" not in enriched_json:
        return enriched_json
    file_path = file_input.name if hasattr(file_input, "name") else file_input
    if file_path.endswith(".pdf"):
        result = process_single_pdf(file_path, enriched_json)
        return result
    return enriched_json


def send_to_json_editor(json_data):
    if isinstance(json_data, str):
        json_data = json.loads(json_data)
    return json.dumps(json_data, indent=4), json_data


def save_json(content, project_id, document_id, project_name, project_type,
              display_name, document_type, date_issued, act):
    """Save the JSON with metadata to condition-loader/condition_jsons/."""
    try:
        if isinstance(content, str):
            content_dict = json.loads(content)
        else:
            content_dict = content

        # Add metadata fields
        content_dict["project_id"] = project_id or ""
        content_dict["project_name"] = project_name or ""
        content_dict["project_type"] = project_type or ""
        content_dict["document_id"] = document_id or ""
        content_dict["display_name"] = display_name or ""
        content_dict["document_type"] = document_type or ""
        content_dict["date_issued"] = date_issued or ""
        content_dict["act"] = int(act) if act else None

        # Build filename from project_id and document_id
        if project_id and document_id:
            filename = f"{project_id}_{document_id}.json"
        elif project_id:
            filename = f"{project_id}.json"
        else:
            filename = "output.json"

        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_path = os.path.join(OUTPUT_DIR, filename)

        with open(output_path, "w") as f:
            json.dump(content_dict, f, indent=4)

        return f"Saved to {output_path}", json.dumps(content_dict, indent=4), content_dict
    except Exception as e:
        return f"Save failed: {str(e)}", content, None


# ---------------------------------------------------------------------------
# Gradio UI
# ---------------------------------------------------------------------------

with gr.Blocks(theme=gr.themes.Soft()) as app:
    print("Starting the application")
    file_input = gr.File(label="File Input")

    # Hidden state to store the classification result
    classification_state = gr.State(value=None)

    with gr.Tab("Condition Extractor"):
        # --- Classification section ---
        with gr.Row():
            classify_button = gr.Button("Classify Document", variant="primary")
            classification_display = gr.Textbox(
                label="Document Classification",
                lines=4,
                interactive=False,
                placeholder="Click 'Classify Document' to analyze the document structure..."
            )

        classify_button.click(
            fn=classify_document_ui,
            inputs=file_input,
            outputs=[classification_state, classification_display]
        )

        # --- Extraction section ---
        with gr.Column():
            submit_button = gr.Button("Extract & Enrich Conditions", variant="primary")
            extracted_conditions = gr.JSON(label="Extracted & Enriched Conditions")
            first_nations_result = gr.JSON(label="With First Nations")

    with gr.Tab("JSON Editor"):
        # --- Metadata inputs ---
        with gr.Row():
            project_id_input = gr.Textbox(label="Project ID", placeholder="e.g. 60f078d3332ebd0022a39224")
            document_id_input = gr.Textbox(label="Document ID", placeholder="e.g. 6977bca0ee48aedc8fe2f234")
        with gr.Row():
            project_name_input = gr.Textbox(label="Project Name", placeholder="e.g. Eskay Creek Revitalization")
            project_type_input = gr.Textbox(label="Project Type", placeholder="e.g. Mines")
        with gr.Row():
            display_name_input = gr.Textbox(label="Display Name", placeholder="e.g. Eskay Creek - EAC M26-01 - Schedule B")
            document_type_input = gr.Textbox(label="Document Type", placeholder="e.g. Schedule B/Certificate")
        with gr.Row():
            date_issued_input = gr.Textbox(label="Date Issued", placeholder="e.g. 2026-01-26T07:00:00")
            act_input = gr.Textbox(label="Act", placeholder="e.g. 2018")

        with gr.Row():
            save_button = gr.Button("Save JSON", variant="primary")

        status_output = gr.Textbox(label="Status", lines=1, interactive=False)

        with gr.Row():
            json_viewer = gr.JSON(label="JSON Viewer")
            json_editor = gr.Textbox(label="JSON Content Editor", lines=500)

    # --- Pipeline: Classify -> Extract & Enrich -> First Nations -> Editor ---
    submit_button.click(
        fn=extract_and_enrich_ui,
        inputs=[file_input, classification_state],
        outputs=[extracted_conditions]
    ).then(
        fn=add_first_nations_ui,
        inputs=[file_input, extracted_conditions],
        outputs=[first_nations_result]
    ).then(
        fn=send_to_json_editor,
        inputs=[first_nations_result],
        outputs=[json_editor, json_viewer]
    )

    # Save JSON with metadata to condition-loader/condition_jsons/
    save_button.click(
        fn=save_json,
        inputs=[json_editor, project_id_input, document_id_input, project_name_input,
                project_type_input, display_name_input, document_type_input,
                date_issued_input, act_input],
        outputs=[status_output, json_editor, json_viewer]
    )

app.launch(server_name="0.0.0.0", server_port=7860)
