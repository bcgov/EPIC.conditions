from utils import convert_to_pg_array

def insert_subconditions(cur, condition_id, parent_id, subconditions):
    """Insert subconditions (recursive) exactly like original code."""
    for index, sub in enumerate(subconditions, start=1):
        cur.execute("""
            INSERT INTO condition.subconditions (
                condition_id, parent_subcondition_id, sort_order,
                amended_document_id, subcondition_identifier, subcondition_text, is_active, created_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            condition_id, parent_id, index, None,
            sub.get('subcondition_identifier') or sub.get('clause_identifier'),
            sub.get('subcondition_text') or sub.get('clause_text'),
            sub.get('is_active', True)
        ))
        sub_id = cur.fetchone()[0]

        # Recursive insert for nested subconditions
        if sub.get('subconditions'):
            insert_subconditions(cur, condition_id, sub_id, sub['subconditions'])

def insert_condition(cur, condition, project_id, document_id):
    topic_tags_pg = convert_to_pg_array(condition['topic_tags'])
    subtopic_tags_pg = convert_to_pg_array(condition['subtopic_tags'])
    
    cur.execute("""
        INSERT INTO condition.conditions (
            project_id, document_id, condition_name, condition_number,
            condition_text, topic_tags, subtopic_tags,
            effective_from, effective_to, is_approved,
            is_topic_tags_approved, is_condition_attributes_approved,
            is_active, requires_management_plan, condition_type, created_date
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
    """, (
        project_id, document_id,
        condition.get('condition_name'), condition.get('condition_number'),
        condition.get('condition_text'), topic_tags_pg, subtopic_tags_pg,
        condition.get('effective_from'), condition.get('effective_to'),
        condition.get('is_approved', False),
        False, False,
        condition.get('is_active', True),
        False, 'ADD'
    ))
    return cur.fetchone()[0]
