"""Tests for extraction request database helpers."""

from datetime import date, datetime

import pytest
from flask import Flask

from condition_cron.services.db_service import _json_default, get_pending_requests


def test_json_default_serializes_date_values():
    """DB metadata dates should be safe to persist inside extracted_data JSON."""
    assert _json_default(date(2026, 1, 13)) == "2026-01-13"
    assert _json_default(datetime(2026, 1, 13, 9, 45, 7)) == "2026-01-13T09:45:07"


def test_json_default_rejects_unknown_values():
    """Unexpected non-JSON values should still fail loudly."""
    with pytest.raises(TypeError):
        _json_default(object())


class _FakeConnection:
    def close(self):
        return None


class _FakeCursor:
    description = [
        ("id",),
        ("project_id",),
        ("document_id",),
        ("document_type_id",),
        ("document_label",),
        ("s3_url",),
        ("status",),
        ("project_name",),
        ("project_type",),
        ("date_issued",),
        ("act",),
        ("document_file_name",),
        ("document_type",),
    ]

    def __init__(self, fetchone_results):
        self._fetchone_results = iter(fetchone_results)

    def execute(self, query, params=None):
        return None

    def fetchone(self):
        return next(self._fetchone_results, None)

    def close(self):
        return None


def test_get_pending_requests_blocks_new_work_when_processing_is_active(monkeypatch):
    """A fresh processing request should stop the cron from claiming new work."""
    app = Flask(__name__)
    app.config["EXTRACTION_PROCESSING_STALE_AFTER_MINUTES"] = 120
    cursor = _FakeCursor([(1,)])

    monkeypatch.setattr(
        "condition_cron.services.db_service._get_connection",
        lambda: (_FakeConnection(), cursor),
    )

    with app.app_context():
        assert get_pending_requests() == []
