"""DB service — read and update extraction_requests, fetch supporting metadata."""

import logging
import json
from datetime import date, datetime
from typing import Optional

import psycopg2
from psycopg2.extras import Json
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


def _json_default(value):
    """Serialize DB-native values that can be carried into extracted_data metadata."""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    raise TypeError(f'Object of type {value.__class__.__name__} is not JSON serializable')


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
                er.status,
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
            WHERE er.status = 'pending'
               OR (er.status = 'processing' AND er.updated_date < NOW() - INTERVAL '2 hours')
            ORDER BY er.created_date ASC
            """
        )
        rows = cur.fetchall()
        cols = [desc[0] for desc in cur.description]
        return [dict(zip(cols, row)) for row in rows]
    finally:
        cur.close()
        conn.close()


def get_request_status(request_id: int) -> Optional[str]:
    """Return the current status for an extraction request."""
    conn, cur = _get_connection()
    try:
        cur.execute(
            "SELECT status FROM condition.extraction_requests WHERE id = %s",
            (request_id,),
        )
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        cur.close()
        conn.close()


def _update_extraction_request_state(
    request_id: int,
    status: str,
    error_message: str = None,
    extracted_data: dict = None,
) -> None:
    """Update request state, optional error text, and optional extracted JSON."""
    conn, cur = _get_connection()
    try:
        extracted_data_json = (
            Json(extracted_data, dumps=lambda value: json.dumps(value, default=_json_default))
            if extracted_data
            else None
        )
        cur.execute(
            """
            UPDATE condition.extraction_requests
            SET status = %s,
                error_message = %s,
                extracted_data = %s,
                updated_date = NOW()
            WHERE id = %s
            """,
            (status, error_message, extracted_data_json, request_id),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def mark_processing(request_id: int) -> None:
    """Mark an extraction request as actively processing."""
    _update_extraction_request_state(request_id, 'processing')


def mark_failed(request_id: int, error_message: str) -> None:
    """Mark an extraction request as failed with an error message."""
    _update_extraction_request_state(request_id, 'failed', error_message=error_message)


def save_extraction_result(request_id: int, extracted_data: dict) -> None:
    """Save parsed extraction JSON and mark the request completed."""
    _update_extraction_request_state(request_id, 'completed', extracted_data=extracted_data)
