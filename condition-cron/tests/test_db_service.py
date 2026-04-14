"""Tests for extraction request database helpers."""

from datetime import date, datetime

import pytest

from condition_cron.services.db_service import _json_default


def test_json_default_serializes_date_values():
    """DB metadata dates should be safe to persist inside extracted_data JSON."""
    assert _json_default(date(2026, 1, 13)) == "2026-01-13"
    assert _json_default(datetime(2026, 1, 13, 9, 45, 7)) == "2026-01-13T09:45:07"


def test_json_default_rejects_unknown_values():
    """Unexpected non-JSON values should still fail loudly."""
    with pytest.raises(TypeError):
        _json_default(object())
