import os
import json
import psycopg2

# Database connection
conn = psycopg2.connect(
    dbname="app",
    user="condition",
    password="condition",
    host="localhost",
    port="54337"
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

            project_id = data['project_id']
            document_id = data['document_id']

            # Check if the record already exists
            cur.execute("""
                SELECT 1 FROM projects WHERE project_id = %s AND document_id = %s
            """, (project_id, document_id))
            if cur.fetchone():
                print(f"Skipping {filename} due to matching project_id and document_id.")
                continue

            # Insert into projects table
            cur.execute("""
                INSERT INTO projects (
                    project_id, project_name, document_id, display_name, document_file_name, date_issued, act
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                project_id, data['project_name'], document_id, data['display_name'], data['document_file_name'],
                data['date_issued'], data['act']
            ))

            # Insert into conditions table
            for condition in data['conditions']:
                topic_tags_pg = convert_to_pg_array(condition['topic_tags'])
                subtopic_tags_pg = convert_to_pg_array(condition['subtopic_tags'])

                cur.execute("""
                    INSERT INTO conditions (
                        project_id, document_id, condition_name, condition_number, condition_text,
                        topic_tags, subtopic_tags
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    project_id, document_id, condition['condition_name'], condition['condition_number'],
                    condition['condition_text'], topic_tags_pg, subtopic_tags_pg
                ))

    conn.commit()

# Folder path containing JSON files
folder_path = './condition_jsons'
load_data(folder_path)

# Close database connection
cur.close()
conn.close()
