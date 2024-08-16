import os
import gradio as gr
import psycopg2

# Database connection setup
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "app"),
        user=os.getenv("DB_USER", "condition"),
        password=os.getenv("DB_PASSWORD", "condition"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "54337")  # Specify the port
    )
    return conn

# Function to fetch all projects from the database
def fetch_projects():
    schema = os.getenv("DB_SCHEMA", "condition")
    conn = get_db_connection()
    cursor = conn.cursor()
    query = f"SELECT project_id, project_name FROM {schema}.projects;"
    cursor.execute(query)
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return [(project_name, project_id) for project_id, project_name in projects]  # Returning as (label, value) pairs

# Function to search the database for conditions related to the selected project
def search_records(project_id):
    schema = os.getenv("DB_SCHEMA", "condition")
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ensure project_id is extracted properly and passed as a string
    query = f"""
    SELECT 
        a.condition_number, 
        a.condition_name, 
        a.condition_text, 
        string_agg(c.deliverable_name, ', ') as deliverable_names
    FROM {schema}.conditions a 
    INNER JOIN {schema}.projects b 
    ON a.project_id = b.project_id 
    LEFT JOIN {schema}.deliverables c 
    ON a.id = c.condition_id
    WHERE b.project_id = %s::text
    GROUP BY a.condition_number, a.condition_name, a.condition_text;
    """
    cursor.execute(query, (str(project_id),))  # Convert project_id to string explicitly
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results if results else [["No results found.", "", "", ""]]


# Function to update the dropdown with the latest projects
def update_dropdown():
    projects = fetch_projects()
    if projects:
        return gr.update(choices=[(name, id) for name, id in projects], value=projects[0][1], interactive=True)
    else:
        return gr.update(choices=[], value=None, interactive=False), "No projects available. Please add a project to the database."

# Define the Gradio interface using Blocks
def search(project_id):
    results = search_records(project_id)
    return results

with gr.Blocks() as demo:
    project_dropdown = gr.Dropdown(label="Select a project")
    output_table = gr.Dataframe(headers=["Condition Number", "Condition Name", "Condition Text",
                                         "Deliverable Name"], wrap=True)
    
    project_dropdown.change(fn=search, inputs=project_dropdown, outputs=output_table)
    demo.load(fn=update_dropdown, outputs=project_dropdown)

demo.launch(server_name="0.0.0.0", server_port=7860)
