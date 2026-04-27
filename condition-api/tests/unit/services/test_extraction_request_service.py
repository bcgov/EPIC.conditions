"""Tests for extraction request service behavior."""

import uuid

from flask import g

from condition_api.models import (
    Condition,
    ConditionAttribute,
    ExtractionRequest,
    ManagementPlan,
    Subcondition,
    db,
)
from condition_api.services.extraction_request_service import ExtractionRequestService
from tests.utilities.factory_utils import (
    factory_document_model,
    factory_project_model,
    factory_user_model,
    get_seeded_document_type,
)
from tests.utilities.factory_scenarios import TestJwtClaims


def test_create_request_sets_uploaded_by_staff_user_id():
    """Create stores the uploader via an explicit staff user foreign key."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    staff_user = factory_user_model(auth_guid=auth_guid)
    g.jwt_oidc_token_info = TestJwtClaims.staff_admin_role

    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)

    result = ExtractionRequestService.create(
        {
            "project_id": project.project_id,
            "document_id": document.document_id,
            "document_type_id": doc_type.id,
            "document_label": document.document_label,
            "original_file_name": "uploaded.pdf",
            "s3_url": "condition_extraction_documents/uploaded.pdf",
            "file_size_bytes": 1234,
        }
    )

    assert result.uploaded_by_staff_user_id == staff_user.id
    assert result.uploaded_by_name


def test_reject_request_soft_rejects_and_clears_extracted_data():
    """Rejecting preserves the request for archive display but drops raw JSON."""
    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    request = ExtractionRequest(
        project_id=project.project_id,
        document_id=document.document_id,
        document_type_id=doc_type.id,
        document_label=document.document_label,
        s3_url="condition_extraction_documents/test.pdf",
        status="completed",
        extracted_data={"conditions": [{"condition_number": 1}]},
    )
    db.session.add(request)
    db.session.commit()

    result = ExtractionRequestService.reject_request(request.id)

    assert result.status == "rejected"
    assert result.extracted_data is None

    persisted = db.session.query(ExtractionRequest).filter_by(id=request.id).one()
    assert persisted.status == "rejected"
    assert persisted.extracted_data is None


def test_import_request_loads_conditions_into_existing_document():
    """Import uses the request target document and writes conditions via the ORM service."""
    auth_guid = TestJwtClaims.staff_admin_role['sub']
    staff_user = factory_user_model(auth_guid=auth_guid)
    g.jwt_oidc_token_info = TestJwtClaims.staff_admin_role

    project = factory_project_model(project_id=str(uuid.uuid4()))
    doc_type = get_seeded_document_type("Certificate")
    document = factory_document_model(project_id=project.project_id, document_type_id=doc_type.id)
    request = ExtractionRequest(
        project_id=project.project_id,
        document_id=document.document_id,
        document_type_id=doc_type.id,
        document_label=document.document_label,
        s3_url="condition_extraction_documents/test.pdf",
        status="completed",
        extracted_data={
            "conditions": [
                {
                    "condition_number": 1,
                    "condition_name": "Construction Environmental Management Plan",
                    "condition_text": "Prepare and implement the plan.",
                    "topic_tags": ["Environmental", "Water"],
                    "subtopic_tags": ["Fish"],
                    "deliverables": [
                        {
                            "is_plan": True,
                            "deliverable_name": "Construction Environmental Management Plan",
                            "management_plan_acronym": "CEMP",
                            "approval_type": "review",
                            "related_phase": "construction",
                            "days_prior_to_commencement": "30",
                            "fn_consultation_required": True,
                            "stakeholders_to_consult": ["Nation A", "Nation B"],
                            "stakeholders_to_submit_to": ["EAO"],
                            "implementation_phase": "construction",
                        }
                    ],
                    "clauses": [
                        {
                            "clause_identifier": "1.a",
                            "clause_text": "First nested clause",
                            "subconditions": [
                                {
                                    "subcondition_identifier": "1.a.i",
                                    "subcondition_text": "Second nested clause",
                                }
                            ],
                        }
                    ],
                }
            ]
        },
    )
    db.session.add(request)
    db.session.commit()

    result = ExtractionRequestService.import_request(request.id)

    assert result.status == "imported"
    assert result.extracted_data is None
    assert result.imported_by_staff_user_id == staff_user.id
    assert result.imported_by_name

    condition = db.session.query(Condition).filter_by(document_id=document.document_id).one()
    assert condition.project_id == project.project_id
    assert condition.condition_name == "Construction Environmental Management Plan"
    assert condition.requires_management_plan is True

    plans = db.session.query(ManagementPlan).filter_by(condition_id=condition.id).all()
    assert len(plans) == 1
    assert plans[0].name == "Construction Environmental Management Plan"

    subconditions = (
        db.session.query(Subcondition)
        .filter_by(condition_id=condition.id)
        .order_by(Subcondition.sort_order.asc(), Subcondition.id.asc())
        .all()
    )
    assert len(subconditions) == 2
    assert subconditions[0].subcondition_identifier == "1.a"
    assert subconditions[1].parent_subcondition_id == subconditions[0].id

    attributes = db.session.query(ConditionAttribute).filter_by(condition_id=condition.id).all()
    assert len(attributes) >= 6
