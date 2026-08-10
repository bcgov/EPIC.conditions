"""Tests for deterministic PDF table extraction."""

from condition_cron.extraction import extractor, pdf_reader


def test_table_extraction_carries_subject_area_for_red_chris_style_rows(monkeypatch):
    """Rows with blank subject cells should inherit the latest subject header."""
    tables = [[
        ["Subject Area", "Ref #", "COMMITMENT", "Agency*", "Timing"],
        ["F. Water Quality", None, "", "", ""],
        [
            "",
            "F1",
            "RCDC will capture runoff from the camp and plant site area and divert it to the TSF.",
            "EMPR/\nDFO/\nMOE",
            "Operation/\nClosure",
        ],
        [
            "",
            "F2",
            "RCDC will investigate the possibility of directing post-closure drainage.",
            "EMPR/\nMOE",
            "Operation/\nClosure",
        ],
    ]]

    monkeypatch.setattr(pdf_reader, "read_pdf_tables", lambda file_path: tables)

    result = extractor.extract_conditions_from_pages(
        "red-chris.pdf",
        {"document_type": "table_format", "has_numbered_conditions": False},
    )

    assert [condition["condition_ref"] for condition in result["conditions"]] == ["F1", "F2"]
    assert result["conditions"][0]["condition_name"] == "F1 - Water Quality"
    assert result["conditions"][1]["condition_name"] == "F2 - Water Quality"
    assert result["conditions"][0]["condition_number"] == 1
    assert result["conditions"][1]["condition_number"] == 2
    assert result["conditions"][0]["subject_area"] == "F. Water Quality"
    assert result["conditions"][0]["source_agencies"] == "EMPR/ DFO/ MOE"
    assert result["conditions"][0]["timing"] == "Operation/ Closure"


def test_table_extraction_appends_continuation_rows(monkeypatch):
    """Blank-ref rows inside a table should extend the previous commitment."""
    tables = [[
        ["Subject Area", "Ref #", "COMMITMENT", "Agency*", "Timing"],
        ["F. Water Quality", None, "", "", ""],
        ["", "F13", "RCDC will undertake necessary measures.", "MOE", "Operation"],
        ["", "", "These measures may include additional treatment of impoundment water.", "", ""],
    ]]

    monkeypatch.setattr(pdf_reader, "read_pdf_tables", lambda file_path: tables)

    result = extractor.extract_conditions_from_pages(
        "red-chris.pdf",
        {"document_type": "table_format", "has_numbered_conditions": False},
    )

    assert len(result["conditions"]) == 1
    assert result["conditions"][0]["condition_ref"] == "F13"
    assert result["conditions"][0]["condition_text"] == (
        "RCDC will undertake necessary measures.\n"
        "These measures may include additional treatment of impoundment water."
    )
