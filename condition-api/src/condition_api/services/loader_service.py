"""Loader service — insert extracted conditions into PostgreSQL.

Column lists and INSERT logic mirror condition-loader/loaders/ exactly.
"""

import logging

from condition_api.models.db import db
from flask import current_app

logger = logging.getLogger(__name__)

KEY_TO_LABEL_MAP = {
    'fn_consultation_required': 'Requires consultation',
    'is_plan': 'Requires management plan(s)',
    'approval_type': 'Submitted to EAO for',
    'related_phase': 'Milestone(s) related to plan submission',
    'days_prior_to_commencement': 'Time associated with submission milestone',
    'stakeholders_to_consult': 'Parties required to be consulted',
    'deliverable_name': 'Management plan name(s)',
    'stakeholders_to_submit_to': 'Parties required to be submitted',
    'management_plan_acronym': 'Management plan acronym(s)',
    'implementation_phase': 'Project phases(s) related to plan implementation',
}

DEFAULT_DELIVERABLE_KEYS = [
    'approval_type',
    'days_prior_to_commencement',
    'related_phase',
    'deliverable_name',
    'management_plan_acronym',
    'fn_consultation_required',
    'implementation_phase',
]

CONSULTATION_KEYS = ['stakeholders_to_consult']


def _get_connection():
    conn = db.engine.raw_connection()
    return conn, conn.cursor()


def _convert_to_pg_array(values: list) -> str:
    if not values:
        return '{}'
    escaped = [str(v).replace('"', '\\"') for v in values]
    return '{' + ','.join(f'"{v}"' for v in escaped) + '}'


def _get_document_category_id(cur, document_type: str):
    cur.execute(
        'SELECT id FROM condition.document_types WHERE document_type = %s',
        (document_type,),
    )
    row = cur.fetchone()
    return row[0] if row else None


# ── Project ───────────────────────────────────────────────────────────────────

def _insert_project(cur, project_id: str, project_name: str, project_type: str):
    cur.execute(
        """
        INSERT INTO condition.projects (project_id, project_name, project_type, created_date)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (project_id) DO NOTHING
        """,
        (project_id, project_name, project_type),
    )


# ── Document ──────────────────────────────────────────────────────────────────

def _document_exists(cur, document_id: str) -> bool:
    cur.execute('SELECT 1 FROM condition.documents WHERE document_id = %s', (document_id,))
    return cur.fetchone() is not None


def _insert_document(cur, data: dict, project_id: str) -> str:
    doc_id = data['document_id']
    if _document_exists(cur, doc_id):
        logger.info('Skipping document %s — already exists.', doc_id)
        return doc_id

    cur.execute(
        """
        INSERT INTO condition.documents (
            document_id, document_type_id, document_label, document_link,
            document_file_name, date_issued, act, first_nations,
            consultation_records_required, is_latest_amendment_added, project_id, created_date
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """,
        (
            doc_id,
            _get_document_category_id(cur, data.get('document_type', '')),
            data.get('display_name', ''),
            data.get('document_link'),
            data.get('document_file_name', ''),
            data.get('date_issued'),
            data.get('act'),
            _convert_to_pg_array(data.get('first_nations', [])),
            data.get('consultation_records_required', False),
            True,
            project_id,
        ),
    )
    return doc_id


# ── Conditions ────────────────────────────────────────────────────────────────

def _insert_condition(cur, condition: dict, project_id: str, document_id: str) -> int:
    cur.execute(
        """
        INSERT INTO condition.conditions (
            project_id, document_id, condition_name, condition_number,
            condition_text, topic_tags, subtopic_tags,
            effective_from, effective_to, is_approved,
            is_topic_tags_approved, is_condition_attributes_approved,
            is_active, requires_management_plan, condition_type, created_date
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id
        """,
        (
            project_id,
            document_id,
            condition.get('condition_name'),
            condition.get('condition_number'),
            condition.get('condition_text'),
            _convert_to_pg_array(condition.get('topic_tags', [])),
            _convert_to_pg_array(condition.get('subtopic_tags', [])),
            condition.get('effective_from'),
            condition.get('effective_to'),
            condition.get('is_approved', False),
            False,
            False,
            condition.get('is_active', True),
            False,
            'ADD',
        ),
    )
    return cur.fetchone()[0]


def _insert_subconditions(cur, condition_id: int, parent_id, subconditions: list):
    for index, sub in enumerate(subconditions, start=1):
        cur.execute(
            """
            INSERT INTO condition.subconditions (
                condition_id, parent_subcondition_id, sort_order,
                amended_document_id, subcondition_identifier, subcondition_text,
                is_active, created_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
            """,
            (
                condition_id,
                parent_id,
                index,
                None,
                sub.get('subcondition_identifier') or sub.get('clause_identifier'),
                sub.get('subcondition_text') or sub.get('clause_text'),
                sub.get('is_active', True),
            ),
        )
        sub_id = cur.fetchone()[0]
        if sub.get('subconditions'):
            _insert_subconditions(cur, condition_id, sub_id, sub['subconditions'])


# ── Attributes ────────────────────────────────────────────────────────────────

def _insert_condition_attributes(cur, condition_id: int, condition: dict):
    if 'deliverables' not in condition:
        return

    for deliverable in condition['deliverables']:
        is_plan = deliverable.get('is_plan', False)
        fn_consultation_required = deliverable.get('fn_consultation_required', False)
        deliverable_name = deliverable.get('deliverable_name', '')

        management_plan_id = None
        if is_plan:
            cur.execute(
                'UPDATE condition.conditions SET requires_management_plan = TRUE WHERE id = %s',
                (condition_id,),
            )
            cur.execute(
                """
                INSERT INTO condition.management_plans (condition_id, name, is_approved, created_date)
                VALUES (%s, %s, %s, NOW())
                RETURNING id
                """,
                (condition_id, deliverable_name, False),
            )
            management_plan_id = cur.fetchone()[0]

        for key in DEFAULT_DELIVERABLE_KEYS:
            label = KEY_TO_LABEL_MAP.get(key)
            if not label:
                continue
            cur.execute('SELECT id FROM condition.attribute_keys WHERE key_name = %s', (label,))
            row = cur.fetchone()
            if not row:
                continue
            attribute_key_id = row[0]

            if key == 'deliverable_name':
                value = deliverable_name
            elif key in ('stakeholders_to_consult', 'stakeholders_to_submit_to'):
                val_list = deliverable.get(key, [])
                value = _convert_to_pg_array(val_list) if val_list else '{}'
            else:
                value = deliverable.get(key, '')
                if isinstance(value, bool):
                    value = 'true' if value else 'false'
                else:
                    value = str(value)

            cur.execute(
                """
                INSERT INTO condition.condition_attributes
                (condition_id, attribute_key_id, attribute_value, management_plan_id, created_date)
                VALUES (%s, %s, %s, %s, NOW())
                """,
                (condition_id, attribute_key_id, value, management_plan_id),
            )

        if fn_consultation_required:
            for key in CONSULTATION_KEYS:
                label = KEY_TO_LABEL_MAP.get(key)
                if not label:
                    continue
                cur.execute('SELECT id FROM condition.attribute_keys WHERE key_name = %s', (label,))
                row = cur.fetchone()
                if not row:
                    continue
                attribute_key_id = row[0]

                if key == 'fn_consultation_required':
                    value = 'true'
                elif key == 'stakeholders_to_consult':
                    stakeholders = deliverable.get('stakeholders_to_consult', [])
                    value = _convert_to_pg_array(stakeholders) if stakeholders else '{}'
                else:
                    value = deliverable.get(key, '')
                    value = 'true' if value is True else ('false' if value is False else str(value))

                cur.execute(
                    """
                    INSERT INTO condition.condition_attributes
                    (condition_id, attribute_key_id, attribute_value, management_plan_id, created_date)
                    VALUES (%s, %s, %s, %s, NOW())
                    """,
                    (condition_id, attribute_key_id, value, management_plan_id),
                )


# ── Public entry point ────────────────────────────────────────────────────────

def load_extracted_data(data: dict):
    """Insert a fully-extracted document dict into the condition database."""
    conn, cur = _get_connection()
    try:
        project_id = data['project_id']
        _insert_project(cur, project_id, data.get('project_name', ''), data.get('project_type', ''))
        document_id = _insert_document(cur, data, project_id)

        for condition in data.get('conditions', []):
            condition_id = _insert_condition(cur, condition, project_id, document_id)
            _insert_condition_attributes(cur, condition_id, condition)
            _insert_subconditions(cur, condition_id, None, condition.get('clauses', []))

        conn.commit()
        logger.info('Loaded document %s (%d conditions)', document_id, len(data.get('conditions', [])))
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
