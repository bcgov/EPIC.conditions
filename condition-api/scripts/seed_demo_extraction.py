"""Seed local-only extraction requests for UI testing.

This does not call Azure, OpenAI, object storage, or the cron. It reads completed
extraction JSON fixtures from test_documents/completed_jsons and writes realistic
rows into condition.extraction_requests so the Extracted Documents UI has data.
"""

import argparse
import copy
import json
import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from condition_api import create_app
from condition_api.models.db import db
from condition_api.models.document_type import DocumentType
from condition_api.models.extraction_request import ExtractionRequest
from condition_api.models.project import Project


DEFAULT_STATUSES = ("completed", "failed", "pending", "processing", "imported")
TOPIC_TAGS = (
    "Air Quality",
    "Environmental",
    "Fish & Fish Habitat",
    "Marine Resources",
    "Monitoring",
    "Transportation",
    "Water",
    "Wildlife",
)
PROJECTS = (
    ("DEMO-CARIBOO-GOLD", "Cariboo Gold Project", "Mine"),
    ("DEMO-WOODFIBRE", "Woodfibre LNG Project", "Energy"),
    ("DEMO-EELGRASS", "Eelgrass Habitat Project", "Infrastructure"),
)


def _fixture_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "test_documents" / "completed_jsons"


def _load_payloads(fixture_dir: Path) -> list[tuple[str, dict]]:
    payloads = []
    for path in sorted(fixture_dir.glob("*.json")):
        with path.open() as fixture:
            payloads.append((path.stem, json.load(fixture)))
    if not payloads:
        raise RuntimeError(f"No JSON fixtures found in {fixture_dir}")
    return payloads


def _get_or_create_project(index: int) -> Project:
    project_id, project_name, project_type = PROJECTS[index % len(PROJECTS)]
    project = db.session.query(Project).filter_by(project_id=project_id).first()
    if project:
        project.is_active = True
        return project

    project = Project(
        project_id=project_id,
        project_name=project_name,
        project_type=project_type,
        is_active=True,
    )
    db.session.add(project)
    db.session.flush()
    return project


def _certificate_type_id() -> Optional[int]:
    document_type = db.session.query(DocumentType).filter_by(document_type="Certificate").first()
    return document_type.id if document_type else None


def _randomize_payload(payload: dict, project: Project, document_id: str, document_label: str) -> dict:
    data = copy.deepcopy(payload)
    conditions = data.get("conditions", [])
    random.shuffle(conditions)
    selected_conditions = sorted(
        conditions[: random.randint(min(3, len(conditions)), min(12, len(conditions)))],
        key=lambda condition: condition.get("condition_number") or 0,
    )

    for condition in selected_conditions:
        condition.setdefault("topic_tags", random.sample(TOPIC_TAGS, k=random.randint(1, 3)))
        condition.setdefault("subtopic_tags", [])
        condition.setdefault("clauses", [])

    data.update({
        "project_id": project.project_id,
        "project_name": project.project_name,
        "project_type": project.project_type,
        "document_id": document_id,
        "document_type": "Certificate",
        "display_name": document_label,
        "document_file_name": document_label,
        "date_issued": (datetime.utcnow() - timedelta(days=random.randint(60, 900))).date().isoformat(),
        "act": random.choice([2002, 2018]),
        "conditions": selected_conditions,
    })
    return data


def seed_data(count: int, statuses: list[str], fixture_dir: Path) -> None:
    """Create randomized extraction request rows for local UI testing."""
    app = create_app()
    with app.app_context():
        payloads = _load_payloads(fixture_dir)
        certificate_type_id = _certificate_type_id()

        created = []
        for index in range(count):
            status = statuses[index % len(statuses)]
            fixture_name, payload = random.choice(payloads)
            project = _get_or_create_project(index)
            document_id = f"LOCAL-{status.upper()}-{random.randint(1000, 9999)}"
            document_label = f"{project.project_name.replace(' ', '')}_ScheduleB_TableofConditions.pdf"
            extracted_data = None
            error_message = None

            if status in {"completed", "imported"}:
                extracted_data = _randomize_payload(payload, project, document_id, document_label)
            if status == "imported":
                extracted_data = None
            if status == "failed":
                error_message = (
                    "Unable to extract conditions. This local fixture simulates a scanned "
                    "or unsupported PDF so the manual-entry fallback can be tested."
                )

            req = ExtractionRequest(
                project_id=project.project_id,
                document_id=document_id,
                document_type_id=certificate_type_id,
                document_label=document_label,
                s3_url=f"condition_documents/{fixture_name}-{document_id}.pdf",
                status=status,
                error_message=error_message,
                extracted_data=extracted_data,
                created_date=datetime.utcnow() - timedelta(hours=index + 1),
                updated_date=datetime.utcnow() - timedelta(minutes=random.randint(1, 90)),
            )
            db.session.add(req)
            created.append((status, document_label))

        db.session.commit()

        print(f"Seeded {len(created)} local extraction request(s):")
        for status, document_label in created:
            print(f"  - {status}: {document_label}")
        print("Open the Extracted Documents page in the frontend to test the UI.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=8, help="Number of demo rows to create.")
    parser.add_argument(
        "--statuses",
        default=",".join(DEFAULT_STATUSES),
        help="Comma-separated statuses to cycle through.",
    )
    parser.add_argument(
        "--fixture-dir",
        type=Path,
        default=_fixture_dir(),
        help="Directory containing extraction JSON fixtures.",
    )
    args = parser.parse_args()
    statuses = [status.strip() for status in args.statuses.split(",") if status.strip()]
    seed_data(count=args.count, statuses=statuses, fixture_dir=args.fixture_dir)


if __name__ == "__main__":
    main()
