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

def get_document_category_id(document_type):
    """Determine the document_category_id based on document_type."""
    if document_type == "Order":
        return 2
    elif document_type == "Other":
        return 4
    elif document_type == "Amendment":
        return 3
    elif document_type == "Schedule B/Certificate":
        return 1

def load_data(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            with open(os.path.join(folder_path, filename), 'r') as file:
                data = json.load(file)

            print(f'Loading {filename}')

            project_id = data['project_id']
            document_id = data['document_id']
            document_type = data['document_type']

            # Determine document_category_id
            document_type_id = get_document_category_id(document_type)

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
                    document_id, document_type_id, document_label, document_file_name, 
                    date_issued, act, first_nations, consultation_records_required, project_id, created_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (
                document_id, document_type_id, data['display_name'],
                data['document_file_name'], data['date_issued'], data['act'],
                convert_to_pg_array(data.get('first_nations', [])),
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
                    'related_phase': "Milestone related to plan submission",
                    'days_prior_to_commencement': "Time associated with submission milestone",
                    'stakeholders_to_consult': "Parties required to be consulted",
                    'deliverable_name': "Management plan name",
                    'stakeholders_to_submit_to': "Parties required to be submitted"
                }
                # Insert into condition requirements table
                if 'deliverables' in condition:
                    # Initialize variables for aggregation
                    deliverable_names = []
                    deliverable_names_id = 0
                    is_plan = None
                    is_plan_id = 0
                    approval_type = None
                    approval_type_id = 0
                    fn_consultation_required = None
                    fn_consultation_required_id = 0
                    related_phase = None
                    related_phase_id = 0
                    days_prior_to_commencement = None
                    days_prior_to_commencement_id = 0
                    stakeholders_to_consult_set = set()
                    stakeholders_to_consult_set_id = 0
                    stakeholders_to_submit_to_set = set()
                    stakeholders_to_submit_to_set_id = 0

                    # Dictionary to hold the attribute_key_id and aggregated values for insertion
                    insert_data = []

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

                            # Get the attribute_key_id
                            attribute_key_id = result[0]

                            # Aggregate values based on the key
                            if key == 'deliverable_name':
                                deliverable_names.append(value)
                                deliverable_names_id = attribute_key_id
                            elif key == 'is_plan':
                                if is_plan is None:
                                    is_plan = value
                                    is_plan_id = attribute_key_id
                            elif key == 'approval_type':
                                if approval_type is None:
                                    approval_type = value
                                    approval_type_id = attribute_key_id
                            elif key == 'fn_consultation_required':
                                if fn_consultation_required is None:
                                    fn_consultation_required = value
                                    fn_consultation_required_id = attribute_key_id
                            elif key == 'related_phase':
                                if related_phase is None:
                                    related_phase = value
                                    related_phase_id = attribute_key_id
                            elif key == 'days_prior_to_commencement':
                                if days_prior_to_commencement is None:
                                    days_prior_to_commencement = value
                                    days_prior_to_commencement_id = attribute_key_id
                            elif key == 'stakeholders_to_consult':
                                stakeholders_to_consult_set.update(value)
                                stakeholders_to_consult_set_id = attribute_key_id
                            elif key == 'stakeholders_to_submit_to':
                                stakeholders_to_submit_to_set.update(value)
                                stakeholders_to_submit_to_set_id = attribute_key_id

                    # Finalize aggregated values
                    if deliverable_names:
                        deliverable_names_str = f"{{{', '.join(deliverable_names)}}}"
                        insert_data.append((condition_id, deliverable_names_id, deliverable_names_str))

                    if is_plan is not None:
                        insert_data.append((condition_id, is_plan_id, 'true' if is_plan else 'false'))

                    if approval_type:
                        insert_data.append((condition_id, approval_type_id, approval_type))

                    if fn_consultation_required is not None:
                        insert_data.append((condition_id, fn_consultation_required_id, 'true' if fn_consultation_required else 'false'))

                    if related_phase:
                        insert_data.append((condition_id, related_phase_id, related_phase))

                    if days_prior_to_commencement:
                        insert_data.append((condition_id, days_prior_to_commencement_id, str(days_prior_to_commencement)))

                    if stakeholders_to_consult_set:
                        stakeholders_to_consult_str = f"{{{', '.join(sorted(stakeholders_to_consult_set))}}}"
                        insert_data.append((condition_id, stakeholders_to_consult_set_id, stakeholders_to_consult_str))

                    if stakeholders_to_submit_to_set:
                        stakeholders_to_submit_to_str = f"{{{', '.join(sorted(stakeholders_to_submit_to_set))}}}"
                        insert_data.append((condition_id, stakeholders_to_submit_to_set_id, stakeholders_to_submit_to_str))

                    # Insert only the data that exists
                    for data in insert_data:
                        cur.execute("""
                            INSERT INTO condition.condition_attributes (
                                condition_id, attribute_key_id, attribute_value, created_date
                            ) VALUES (%s, %s, %s, NOW())
                        """, data)

    conn.commit()

# Folder path containing JSON files
reset_tables()
folder_path = './condition_jsons'
load_data(folder_path)

# Close database connection
cur.close()
conn.close()
