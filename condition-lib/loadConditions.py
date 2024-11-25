import os
import json
import psycopg2

from dotenv import load_dotenv
load_dotenv()

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME", "admin"),
    user=os.getenv("DB_USER", "admin"),
    password=os.getenv("DB_PASSWORD", "admin"),
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5438")  # Specify the port
)
cur = conn.cursor()

# Set the schema to 'condition'
cur.execute("SET search_path TO condition")

def convert_to_pg_array(json_array):
    """Convert a JSON array to PostgreSQL array format."""
    return '{' + ','.join(json.dumps(item) for item in json_array) + '}'

def insert_subconditions(condition_id, parent_subcondition_id, subconditions):
    """Insert subconditions recursively."""
    for subcondition in subconditions:
        cur.execute("""
            INSERT INTO condition.subconditions (
                condition_id, parent_subcondition_id, subcondition_identifier, subcondition_text, is_active, created_date
            ) VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            condition_id, parent_subcondition_id,
            subcondition.get('subcondition_identifier'),
            subcondition.get('subcondition_text'),
            True
        ))

        subcondition_id = cur.fetchone()[0]

        # Insert any sub-subconditions (recursive)
        if 'subconditions' in subcondition and subcondition['subconditions']:
            insert_subconditions(condition_id, subcondition_id, subcondition['subconditions'])

def reset_tables():
    """Clear all data from tables and reset ID sequences."""
    tables = [
        "condition_attributes",
        "subconditions",
        "conditions",
        "documents",
        "projects"
    ]
    
    for table in tables:
        cur.execute(f"TRUNCATE TABLE condition.{table} CASCADE")
        cur.execute(f"ALTER SEQUENCE condition.{table}_id_seq RESTART WITH 1")
    print("All tables cleared and ID sequences reset.")

def load_data(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r') as file:
                data = json.load(file)

            print(f'Loading {filename}')

            project_id = data['project_id']
            document_id = data['document_id']

            # Check if the record already exists in the 'documents' table
            cur.execute("""
                SELECT 1 FROM condition.documents WHERE document_id = %s
            """, (document_id,))
            if cur.fetchone():
                print(f"Skipping {filename} due to existing document_id.")
                continue

            # Insert into the 'projects' table (if not exists)
            cur.execute("""
                INSERT INTO condition.projects (
                    project_id, project_name, project_type, created_date
                ) VALUES (%s, %s, %s, NOW())
                ON CONFLICT (project_id) DO NOTHING
            """, (project_id, data['project_name'], data['project_type']))

            # Insert into the 'documents' table
            cur.execute("""
                INSERT INTO condition.documents (
                    document_id, document_type, display_name, document_file_name, 
                    date_issued, act, first_nations, consultation_records_required, project_id, created_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                document_id, data['document_type'], data['display_name'], data['document_file_name'],
                data['date_issued'], data['act'], convert_to_pg_array(data.get('first_nations', [])),
                data.get('consultation_records_required', False), project_id
            ))

            # Insert into conditions table
            for condition in data['conditions']:
                topic_tags_pg = convert_to_pg_array(condition['topic_tags'])
                subtopic_tags_pg = convert_to_pg_array(condition['subtopic_tags'])

                # Insert into conditions table
                cur.execute("""
                    INSERT INTO condition.conditions (
                        project_id, document_id, condition_name, condition_number, condition_text,
                        topic_tags, subtopic_tags, is_approved, is_active, effective_from, effective_to, created_date
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id
                """, (
                    project_id, document_id, condition['condition_name'], condition['condition_number'],
                    condition['condition_text'], topic_tags_pg, subtopic_tags_pg, condition.get('is_approved', False), 
                    condition.get('is_active', True), condition.get('effective_from'), condition.get('effective_to')
                ))

                # Get the ID of the inserted condition to link subconditions (clauses)
                condition_id = cur.fetchone()[0]

                # Insert into subconditions table (clauses)
                for clause in condition.get('clauses', []):
                    cur.execute("""
                        INSERT INTO condition.subconditions (
                            condition_id, parent_subcondition_id, subcondition_identifier, subcondition_text, is_active, created_date
                        ) VALUES (%s, %s, %s, %s, %s, NOW())
                        RETURNING id
                    """, (
                        condition_id, None,  # No parent for the first-level clause
                        clause.get('clause_identifier'),
                        clause.get('clause_text'),
                        condition.get('is_active', True)
                    ))

                    # Get the ID of the inserted clause (subcondition)
                    clause_id = cur.fetchone()[0]

                    # Insert subconditions for this clause if they exist
                    if 'subconditions' in clause and clause['subconditions']:
                        insert_subconditions(condition_id, clause_id, clause['subconditions'])

                key_to_label_map = {
                    'fn_consultation_required': "Requires consultation",
                    'is_plan': "Requires management plan",
                    'approval_type': "Submitted to EAO for",
                    'related_phase': "Phase related to plan",
                    'days_prior_to_commencement': "Days prior to next phase to submit",
                    'stakeholders_to_consult': "Parties required to be consulted",
                    'deliverable_name': "Deliverable Name",
                    'stakeholders_to_submit_to': "Parties required to be submitted"
                }
                # Insert into condition requirements table
                if 'deliverables' in condition:
                    for condition_attribute in condition['deliverables']:
                        for key, value in condition_attribute.items():
                            attribute_label = key_to_label_map.get(key)

                            if not attribute_label:
                                # If no mapping exists for the key, skip it
                                print(f"Skipping unknown key: {key}")
                                continue
                            # Check if the key exists in the attribute_key table
                            cur.execute("""
                                SELECT id FROM condition.attribute_keys WHERE key_name = %s
                            """, (attribute_label,))
                            result = cur.fetchone()

                            if not result:
                                # If the key does not exist in the attribute_key table, skip it
                                print(f"Skipping unknown attribute key: {key}")
                                continue

                            # Get the human-readable label for the attribute key
                            attribute_key_id = result[0]

                            # Convert lists (e.g., stakeholders) to PostgreSQL array string format
                            if isinstance(value, list):
                                value = convert_to_pg_array(value)

                            # Convert booleans to string representation for storage
                            if isinstance(value, bool):
                                value = 'true' if value else 'false'

                            # Insert each key-value pair into the new table
                            cur.execute("""
                                INSERT INTO condition.condition_attributes (
                                    condition_id, attribute_key_id, attribute_value, created_date
                                ) VALUES (%s, %s, %s, NOW())
                            """, (
                                condition_id,
                                attribute_key_id,  # Use the human-readable label here
                                value
                            ))

    conn.commit()

# Folder path containing JSON files
reset_tables()
folder_path = './condition_jsons'
load_data(folder_path)

# Close database connection
cur.close()
conn.close()
