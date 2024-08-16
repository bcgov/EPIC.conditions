import os
import json
import psycopg2

from dotenv import load_dotenv
load_dotenv()

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "app"),
    user=os.getenv("DB_USER", "condition"),
    password=os.getenv("DB_PASSWORD", "condition"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "54337")  # Specify the port
)
cur = conn.cursor()

# Set the schema to 'condition'
cur.execute("SET search_path TO condition")

def convert_to_pg_array(json_array):
    """Convert a JSON array to PostgreSQL array format."""
    return '{' + ','.join(json.dumps(item) for item in json_array) + '}'

def load_data(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r') as file:
                data = json.load(file)

            print(f"Loading {filename}...")

            project_id = data['project_id']
            document_id = data['document_id']

            # Check if the record already exists
            cur.execute("""
                SELECT 1 FROM projects WHERE project_id = %s AND document_id = %s
            """, (project_id, document_id))
            if cur.fetchone():
                print(f"Skipping {filename} due to matching project_id and document_id.")
                continue

            # If project_name is not provided, use the filename
            project_name = data.get('project_name', filename.split('.')[0])


            # Insert into projects table
            cur.execute("""
                INSERT INTO projects (
                    project_id, project_name, document_id, display_name, document_file_name, date_issued, act
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                project_id, project_name, document_id, data['display_name'], data['document_file_name'],
                data['date_issued'], data['act']
            ))

            # Insert into conditions table
            for condition in data['conditions']:
                topic_tags_pg = convert_to_pg_array(condition['topic_tags'])
                subtopic_tags_pg = convert_to_pg_array(condition['subtopic_tags'])

                # Insert into conditions table
                cur.execute("""
                    INSERT INTO condition.conditions (
                        project_id, document_id, condition_name, condition_number, condition_text,
                        topic_tags, subtopic_tags, is_approved, deliverable_name
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    project_id, document_id, condition['condition_name'], condition['condition_number'],
                    condition['condition_text'], topic_tags_pg, subtopic_tags_pg, condition.get('is_approved', False), condition.get('deliverable_name')
                ))

                # Get the ID of the inserted condition to link deliverables
                condition_id = cur.fetchone()[0]



                # Insert into deliverables table
                if 'deliverables' in condition:
                    for deliverable in condition['deliverables']:
                        
                        stakeholders_to_consult_pg = convert_to_pg_array(deliverable.get('stakeholders_to_consult', []))
                        stakeholders_to_submit_to_pg = convert_to_pg_array(deliverable.get('stakeholders_to_submit_to', []))

                        cur.execute("""
                            INSERT INTO condition.deliverables (
                                condition_id, deliverable_name, is_plan, approval_type, 
                                stakeholders_to_consult, stakeholders_to_submit_to,
                                fn_consultation_required, related_phase, days_prior_to_commencement
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            condition_id, 
                            deliverable.get('deliverable_name'), 
                            deliverable.get('is_plan'), 
                            deliverable.get('approval_type'),
                            stakeholders_to_consult_pg, 
                            stakeholders_to_submit_to_pg,
                            deliverable.get('fn_consultation_required'), 
                            deliverable.get('related_phase'),
                            deliverable.get('days_prior_to_commencement')
                        ))




    conn.commit()

# Folder path containing JSON files
folder_path = './condition_jsons'
load_data(folder_path)

# Close database connection
cur.close()
conn.close()