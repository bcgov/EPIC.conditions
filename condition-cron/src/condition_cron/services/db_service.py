"""DB service — read and update extraction_requests, fetch supporting metadata."""

import logging

import psycopg2
from flask import current_app

logger = logging.getLogger(__name__)


def _get_connection():
    cfg = current_app.config
    conn = psycopg2.connect(
        host=cfg['DB_HOST'],
        port=cfg['DB_PORT'],
        dbname=cfg['DB_NAME'],
        user=cfg['DB_USER'],
        password=cfg['DB_PASSWORD'],
    )
    return conn, conn.cursor()


def get_pending_requests() -> list[dict]:
    """Return all pending extraction requests with supporting metadata."""
    conn, cur = _get_connection()
    try:
        cur.execute(
            """
            SELECT
                er.id,
                er.project_id,
                er.document_id,
                er.document_type_id,
                er.document_label,
                er.s3_url,
                p.project_name,
                p.project_type,
                d.date_issued,
                d.act,
                d.document_file_name,
                dt.document_type
            FROM condition.extraction_requests er
            LEFT JOIN condition.projects p ON p.project_id = er.project_id
            LEFT JOIN condition.documents d ON d.document_id = er.document_id
            LEFT JOIN condition.document_types dt ON dt.id = er.document_type_id
            WHERE er.status IN ('pending', 'failed')
            ORDER BY er.created_date ASC
            """
        )
        rows = cur.fetchall()
        cols = [desc[0] for desc in cur.description]
        return [dict(zip(cols, row)) for row in rows]
    finally:
        cur.close()
        conn.close()


def update_status(request_id: int, status: str, error_message: str = None) -> None:
    """Update the status (and optional error message) of an extraction request."""
    conn, cur = _get_connection()
    try:
        cur.execute(
            """
            UPDATE condition.extraction_requests
            SET status = %s,
                error_message = %s,
                updated_date = NOW()
            WHERE id = %s
            """,
            (status, error_message, request_id),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
