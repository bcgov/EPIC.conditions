import gradio as gr
from gpt import count_conditions, extract_all_conditions, extract_all_subconditions
from extract_management_plans import extract_management_plan_info_from_json
from extract_first_nations import process_single_pdf
import psycopg2
from psycopg2 import sql

import json
import os

def save_json_locally(json_data, input_filename):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]
    output_filename = f"{base_name}.json"
    
    # Create the gradio_jsons directory if it doesn't exist
    os.makedirs("./gradio_jsons", exist_ok=True)
    
    output_path = os.path.join("./gradio_jsons", output_filename)
    with open(output_path, 'w') as f:
        json.dump(json_data, f, indent=4)
    return {"message": f"File saved as {output_path}"}, json.dumps(json_data, indent=4), json_data

def display_json(input_filename):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]
    json_filename = f"{base_name}.json"
    json_path = os.path.join("./gradio_jsons", json_filename)
    try:
        with open(json_path, "r") as file:
            content = file.read()
        return content, json.loads(content)
    except FileNotFoundError:
        return "", {}

def insert_or_update_project_in_db(project_id, first_nations, consultation_records_required):
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        schema = os.getenv("DB_SCHEMA")
        cursor = conn.cursor()
        # Check if the project exists
        cursor.execute(
            sql.SQL(f"SELECT EXISTS(SELECT 1 FROM {schema}.projects WHERE project_id = %s)"),
            [project_id]
        )
        exists = cursor.fetchone()[0]

        if exists:
            # Update the project details
            query = sql.SQL(f"""
                UPDATE {schema}.projects 
                SET first_nations = %s, consultation_records_required = %s 
                WHERE project_id = %s
            """)
            params = [first_nations, consultation_records_required, project_id]
            cursor.execute(query, params)
            conn.commit()
            status = "Project updated successfully in the database."
        else:
            # Insert a new record into the table
            query = sql.SQL(f"""
                INSERT INTO {schema}.projects (project_id, project_name, document_id, first_nations, consultation_records_required)
                VALUES (%s, %s, %s, %s, %s)
            """)
            
            # Assuming you have project_name available as a variable
            params = [project_id, project_id, project_id, first_nations, consultation_records_required]
            cursor.execute(query, params)
            conn.commit()
            status = "Project successfully inserted in to the database."

        cursor.close()
        conn.close()

    except Exception as e:
        status = f"Database operation failed: {str(e)}"

    return status

def insert_or_update_condition_in_db(project_id, condition_number, condition_text,
                                     deliverable_names_str, condition_name,
                                     topic_tags, subtopic_tags):
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
        schema = os.getenv("DB_SCHEMA")
        cursor = conn.cursor()

        # Check if the condition exists
        cursor.execute(
            sql.SQL(f"SELECT EXISTS(SELECT 1 FROM {schema}.conditions WHERE project_id = %s AND condition_number = %s)"),
            [project_id, condition_number]
        )
        exists = cursor.fetchone()[0]

        if exists:
            # Update the condition text
            query = sql.SQL("""
                UPDATE conditions 
                SET condition_text = %s, deliverable_name = %s, condition_name = %s
                WHERE project_id = %s AND condition_number = %s
            """)
            params = [condition_text, deliverable_names_str, condition_name, project_id, condition_number]
            cursor.execute(query, params)
            conn.commit()
            status = "Condition updated successfully in the database."
        else:
            # Insert a new record into the table
            query = sql.SQL(f"""
                INSERT INTO {schema}.conditions (project_id, document_id, condition_name, condition_number, condition_text, topic_tags, subtopic_tags, deliverable_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """)
            
            # Assuming you have project_name available as a variable
            params = [project_id, project_id, condition_name, condition_number, condition_text,
                      topic_tags, subtopic_tags, deliverable_names_str]
            cursor.execute(query, params)
            conn.commit()
            status = "Condition successfully inserted in to the database."

        cursor.close()
        conn.close()

    except Exception as e:
        status = f"Database operation failed: {str(e)}"

    return status

def handle_insert_or_update_db(content, input_filename, user_project_id):
    base_name = os.path.splitext(os.path.basename(input_filename))[0]

    try:
        content_dict = json.loads(content)
        project_id = user_project_id if user_project_id else base_name.split("_")[0]

        first_nations = content_dict.get("first_nations", [])
        consultation_records_required = content_dict.get("consultation_records_required")
        status = insert_or_update_project_in_db(project_id, first_nations, consultation_records_required)

        status_list = []
        for condition in content_dict.get("conditions", []):
            condition_number = condition.get("condition_number")
            condition_text = condition.get("condition_text")
            condition_name = condition.get("condition_name")
            topic_tags = condition.get("topic_tags")
            subtopic_tags = condition.get("subtopic_tags")
            deliverables = condition.get("deliverables", [])
            deliverable_names = [d.get("deliverable_name", "") for d in deliverables]
            deliverable_names_str = ", ".join(deliverable_names)
            if condition_number is not None and condition_text is not None:
                status = insert_or_update_condition_in_db(project_id, condition_number, condition_text,
                                                          deliverable_names_str, condition_name,
                                                          topic_tags, subtopic_tags)
                status_list.append(f"Condition {condition_number}: {status}")
        
        status = " | ".join(status_list)
    except Exception as e:
        status = f"Save and update operation failed: {str(e)}"
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
            merged_chunks = gr.JSON(label="Conditions")
            deliverables = gr.JSON(label="Conditions with Extracted Deliverables")
            first_nations = gr.JSON(label="Conditions with Extracted First Nations")
            subconditions = gr.JSON(label="Conditions with Extracted Subconditions")
                
    with gr.Tab("JSON Editor"):
        project_input = gr.Textbox(label="Project", placeholder="Enter project ID (optional)")  # Moved here

        save_button = gr.Button("Save Changes 💾")
        status_output = gr.Textbox(label="Save Status", lines=1, interactive=False)

        with gr.Row():
            json_viewer = gr.JSON(label="JSON Viewer")
            json_editor = gr.Textbox(label="JSON Content Editor", lines=500)

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
        fn=process_single_pdf,
        inputs=[file_input, deliverables],
        outputs=[first_nations]
    ).then(
        fn=extract_all_subconditions,
        inputs=[first_nations],
        outputs=[subconditions]
    )

    # Load and display the JSON content when a file is uploaded
    file_input.change(
        fn=display_json,
        inputs=[file_input],
        outputs=[json_editor, json_viewer]
    )

    # Set up the save button click event
    save_button.click(
        fn=handle_insert_or_update_db,
        inputs=[json_editor, file_input, project_input],
        outputs=[status_output, json_viewer]
    )

app.launch(server_name="0.0.0.0", server_port=7860)
