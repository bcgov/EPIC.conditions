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
    query = f"""
    SELECT a.condition_number, a.condition_name, a.condition_text 
    FROM {schema}.conditions a 
    INNER JOIN {schema}.projects b 
    ON a.project_id = b.project_id 
    WHERE b.project_id = %s::text;
    """
    cursor.execute(query, (project_id,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results if results else [["No results found.", ""]]

# Define the Gradio interface using Blocks
def search(project_id):
    results = search_records(project_id)
    return results

projects = fetch_projects()

with gr.Blocks() as demo:
    project_dropdown = gr.Dropdown(label="Select a project", choices=[(name, id) for name, id in projects], value=projects[0][1])
    output_table = gr.Dataframe(headers=["Condition Number", "Condition Name", "Condition Text"], wrap=True)
    
    project_dropdown.change(fn=search, inputs=project_dropdown, outputs=output_table)

demo.launch(server_name="0.0.0.0", server_port=7860)
