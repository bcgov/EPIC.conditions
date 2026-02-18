import os
import json
from db import get_connection
from loaders.document_loader import insert_project, insert_document
from loaders.condition_loader import insert_condition, insert_subconditions
from loaders.attribute_loader import insert_condition_attributes
from config import FOLDER_PATH

key_to_label_map = {
    'fn_consultation_required': "Requires consultation",
    'is_plan': "Requires management plan(s)",
    'approval_type': "Submitted to EAO for",
    'related_phase': "Milestone(s) related to plan submission",
    'days_prior_to_commencement': "Time associated with submission milestone",
    'stakeholders_to_consult': "Parties required to be consulted",
    'deliverable_name': "Management plan name(s)",
    'stakeholders_to_submit_to': "Parties required to be submitted",
    'management_plan_acronym': "Management plan acronym(s)",
    "implementation_phase": "Project phases(s) related to plan implementation"
}

def load_data(folder_path):
    conn, cur = get_connection()
    for filename in os.listdir(folder_path):
        if not filename.endswith('.json'):
            continue
        with open(os.path.join(folder_path, filename)) as f:
            data = json.load(f)
        
        project_id = data['project_id']
        insert_project(cur, project_id, data['project_name'], data['project_type'])
        document_id = insert_document(cur, data, project_id)
        
        for condition in data['conditions']:
            condition_id = insert_condition(cur, condition, project_id, document_id)
            insert_condition_attributes(cur, condition_id, condition, key_to_label_map)
            
            insert_subconditions(cur, condition_id, None, condition.get('clauses', []))

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    load_data(FOLDER_PATH)
