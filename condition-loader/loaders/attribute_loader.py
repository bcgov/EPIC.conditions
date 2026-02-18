# attribute_loader.py
from utils import convert_to_pg_array

# Default attributes always inserted for a deliverable/plan
DEFAULT_DELIVERABLE_KEYS = [
    'approval_type',                        # submitted_to_eao_for
    'days_prior_to_commencement',           # time_associated_with_submission_milestone
    'related_phase',                        # milestone_related_to_plan_submission
    'deliverable_name',
    'management_plan_acronym',
    'fn_consultation_required',
    'implementation_phase'                  # milestones_related_to_plan_implementation
]

# Additional attributes inserted if fn_consultation_required is True
CONSULTATION_KEYS = [
    'stakeholders_to_consult'               # parties_required_to_be_consulted
]

def insert_condition_attributes(cur, condition_id, condition, key_to_label_map):
    if 'deliverables' not in condition:
        return

    for deliverable in condition['deliverables']:
        is_plan = deliverable.get('is_plan', False)
        fn_consultation_required = deliverable.get('fn_consultation_required', False)
        deliverable_name = deliverable.get('deliverable_name', '')

        # Insert management plan if needed
        management_plan_id = None
        if is_plan:
            cur.execute("UPDATE condition.conditions SET requires_management_plan = TRUE WHERE id = %s", (condition_id,))
            cur.execute("""
                INSERT INTO condition.management_plans (condition_id, name, is_approved, created_date)
                VALUES (%s, %s, %s, NOW())
                RETURNING id
            """, (condition_id, deliverable_name, False))
            management_plan_id = cur.fetchone()[0]

        # Insert default deliverable keys
        for key in DEFAULT_DELIVERABLE_KEYS:
            label = key_to_label_map.get(key)
            if not label:
                continue
            cur.execute("SELECT id FROM condition.attribute_keys WHERE key_name = %s", (label,))
            result = cur.fetchone()
            if not result:
                continue
            attribute_key_id = result[0]

            # Determine value
            if key == 'deliverable_name':
                value = deliverable_name
            elif key in ['stakeholders_to_consult', 'stakeholders_to_submit_to']:
                val_list = deliverable.get(key, [])
                value = convert_to_pg_array(val_list) if val_list else '{}'
            else:
                value = deliverable.get(key, '')  # <-- Default to empty string if missing
                if isinstance(value, bool):
                    value = 'true' if value else 'false'
                else:
                    value = str(value)

            cur.execute("""
                INSERT INTO condition.condition_attributes
                (condition_id, attribute_key_id, attribute_value, management_plan_id, created_date)
                VALUES (%s, %s, %s, %s, NOW())
            """, (condition_id, attribute_key_id, value, management_plan_id))

        # Insert consultation keys if fn_consultation_required
        if fn_consultation_required:
            for key in CONSULTATION_KEYS:
                label = key_to_label_map.get(key)
                if not label:
                    continue
                cur.execute("SELECT id FROM condition.attribute_keys WHERE key_name = %s", (label,))
                result = cur.fetchone()
                if not result:
                    continue
                attribute_key_id = result[0]

                if key == 'fn_consultation_required':
                    value = 'true'
                elif key == 'stakeholders_to_consult':
                    stakeholders = deliverable.get('stakeholders_to_consult', [])
                    value = convert_to_pg_array(stakeholders) if stakeholders else '{}'
                else:
                    value = deliverable.get(key, '')
                    if isinstance(value, bool):
                        value = 'true' if value else 'false'
                    else:
                        value = str(value)

                cur.execute("""
                    INSERT INTO condition.condition_attributes
                    (condition_id, attribute_key_id, attribute_value, management_plan_id, created_date)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (condition_id, attribute_key_id, value, management_plan_id))
