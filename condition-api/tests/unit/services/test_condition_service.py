"""Tests for condition service subcondition updates."""

import uuid

from condition_api.models.subcondition import Subcondition
from condition_api.services.condition_service import ConditionService
from tests.utilities.factory_utils import (
    factory_condition_model,
    factory_document_model,
    factory_project_model,
    get_seeded_document_type,
)


def test_update_condition_reparents_nested_subconditions(session):
    """Updating nested subconditions keeps existing descendants and parent links."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)

    parent = Subcondition(
        condition_id=condition.id,
        subcondition_identifier="1.1",
        subcondition_text="Parent",
        sort_order=1,
    )
    session.add(parent)
    session.flush()

    child = Subcondition(
        condition_id=condition.id,
        parent_subcondition_id=parent.id,
        subcondition_identifier="1.1.1",
        subcondition_text="Child",
        sort_order=1,
    )
    session.add(child)
    session.commit()

    payload = {
        "subconditions": [
            {
                "subcondition_id": str(parent.id),
                "subcondition_identifier": "1.1",
                "subcondition_text": "Parent updated",
                "subconditions": [
                    {
                        "subcondition_id": str(child.id),
                        "subcondition_identifier": "1.1.1",
                        "subcondition_text": "Child updated",
                        "subconditions": [],
                    }
                ],
            }
        ]
    }

    ConditionService.update_condition(payload, condition.id, False, False)

    session.expire_all()
    updated_parent = session.get(Subcondition, parent.id)
    updated_child = session.get(Subcondition, child.id)

    assert updated_parent is not None
    assert updated_parent.subcondition_text == "Parent updated"
    assert updated_child is not None
    assert updated_child.subcondition_text == "Child updated"
    assert updated_child.parent_subcondition_id == parent.id


def test_update_condition_allows_clearing_subconditions(session):
    """Sending an empty subcondition list removes existing subconditions."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    condition = factory_condition_model(project_id=project.project_id, document_id=document.document_id)

    session.add(
        Subcondition(
            condition_id=condition.id,
            subcondition_identifier="1.1",
            subcondition_text="To remove",
            sort_order=1,
        )
    )
    session.commit()

    ConditionService.update_condition({"subconditions": []}, condition.id, False, False)

    remaining = session.query(Subcondition).filter(Subcondition.condition_id == condition.id).all()
    assert remaining == []
