"""Services for importing extracted conditions into the core tables."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition import Condition
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.db import db
from condition_api.models.document import Document
from condition_api.models.management_plan import ManagementPlan
from condition_api.models.subcondition import Subcondition
from condition_api.utils.enums import ConditionType


ATTRIBUTE_EXTERNAL_KEYS = (
    "approval_type",
    "days_prior_to_commencement",
    "related_phase",
    "deliverable_name",
    "management_plan_acronym",
    "fn_consultation_required",
    "implementation_phase",
    "stakeholders_to_submit_to",
    "stakeholders_to_consult",
)


class ExtractionImportService:
    """Import extracted JSON into condition tables using SQLAlchemy models."""

    def __init__(self, project_id: str, document_id: str, payload: dict[str, Any]):
        self.project_id = project_id
        self.document_id = document_id
        self.payload = payload or {}
        self.attribute_keys = self._load_attribute_keys()

    def import_conditions(self) -> None:
        """Insert extracted conditions for an existing project/document pair."""
        self._validate_targets()

        for condition_data in self.payload.get("conditions", []):
            condition = self._create_condition(condition_data)
            self._create_deliverables(condition, condition_data.get("deliverables", []))
            self._create_subconditions(
                condition_id=condition.id,
                parent_subcondition_id=None,
                subconditions=condition_data.get("clauses") or condition_data.get("subconditions") or [],
            )

    def _validate_targets(self) -> None:
        document = Document.query.filter_by(document_id=self.document_id).first()
        if not document:
            raise ValueError(f"Document '{self.document_id}' not found")
        if document.project_id != self.project_id:
            raise ValueError(
                f"Document '{self.document_id}' does not belong to project '{self.project_id}'"
            )

    def _load_attribute_keys(self) -> dict[str, AttributeKey]:
        keys = db.session.query(AttributeKey).all()
        key_map: dict[str, AttributeKey] = {}
        for key in keys:
            key_map[key.key_name] = key
            if key.external_key:
                key_map[key.external_key] = key
        return key_map

    def _create_condition(self, data: dict[str, Any]) -> Condition:
        condition = Condition(
            project_id=self.project_id,
            document_id=self.document_id,
            condition_name=data.get("condition_name"),
            condition_number=data.get("condition_number"),
            condition_text=data.get("condition_text"),
            topic_tags=self._list_or_none(data.get("topic_tags")),
            subtopic_tags=self._list_or_none(data.get("subtopic_tags")),
            effective_from=self._parse_datetime(data.get("effective_from")),
            effective_to=self._parse_datetime(data.get("effective_to")),
            is_approved=bool(data.get("is_approved", False)),
            is_topic_tags_approved=False,
            is_condition_attributes_approved=False,
            is_active=bool(data.get("is_active", True)),
            requires_management_plan=False,
            condition_type=ConditionType.ADD,
        )
        db.session.add(condition)
        db.session.flush()
        return condition

    def _create_subconditions(
        self,
        condition_id: int,
        parent_subcondition_id: int | None,
        subconditions: list[dict[str, Any]],
    ) -> None:
        for sort_order, subcondition_data in enumerate(subconditions, start=1):
            subcondition = Subcondition(
                condition_id=condition_id,
                parent_subcondition_id=parent_subcondition_id,
                sort_order=sort_order,
                amended_document_id=None,
                subcondition_identifier=(
                    subcondition_data.get("subcondition_identifier")
                    or subcondition_data.get("clause_identifier")
                ),
                subcondition_text=(
                    subcondition_data.get("subcondition_text")
                    or subcondition_data.get("clause_text")
                ),
                is_active=bool(subcondition_data.get("is_active", True)),
            )
            db.session.add(subcondition)
            db.session.flush()

            nested_subconditions = (
                subcondition_data.get("subconditions")
                or subcondition_data.get("clauses")
                or []
            )
            if nested_subconditions:
                self._create_subconditions(
                    condition_id=condition_id,
                    parent_subcondition_id=subcondition.id,
                    subconditions=nested_subconditions,
                )

    def _create_deliverables(self, condition: Condition, deliverables: list[dict[str, Any]]) -> None:
        for deliverable in deliverables:
            management_plan = None
            if deliverable.get("is_plan"):
                condition.requires_management_plan = True
                management_plan = ManagementPlan(
                    condition_id=condition.id,
                    name=deliverable.get("deliverable_name"),
                    is_approved=False,
                )
                db.session.add(management_plan)
                db.session.flush()

            for external_key in ATTRIBUTE_EXTERNAL_KEYS:
                attribute_key = self.attribute_keys.get(external_key)
                if not attribute_key:
                    continue

                raw_value = deliverable.get(external_key)
                if raw_value is None:
                    continue

                attribute = ConditionAttribute(
                    condition_id=condition.id,
                    attribute_key_id=attribute_key.id,
                    attribute_value=self._serialize_attribute_value(raw_value),
                    management_plan_id=management_plan.id if management_plan else None,
                )
                db.session.add(attribute)

    @staticmethod
    def _list_or_none(value: Any) -> list[Any] | None:
        if value is None:
            return None
        if isinstance(value, list):
            return value
        return [value]

    @staticmethod
    def _serialize_attribute_value(value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, list):
            return ExtractionImportService._to_pg_array_text(value)
        return str(value)

    @staticmethod
    def _to_pg_array_text(values: list[Any]) -> str:
        if not values:
            return "{}"
        escaped = [str(value).replace('"', '\\"') for value in values]
        return "{" + ",".join(f'"{value}"' for value in escaped) + "}"

    @staticmethod
    def _parse_datetime(value: Any) -> datetime | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, date):
            return datetime.combine(value, datetime.min.time())
        if isinstance(value, str):
            normalized = value.replace("Z", "+00:00")
            return datetime.fromisoformat(normalized)
        raise ValueError(f"Unsupported datetime value: {value!r}")


def load_extracted_data(data: dict[str, Any], project_id: str, document_id: str) -> None:
    """Import extracted conditions for an existing extraction request target."""
    importer = ExtractionImportService(project_id=project_id, document_id=document_id, payload=data)
    importer.import_conditions()
