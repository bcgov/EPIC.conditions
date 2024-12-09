"""Service for amendment management."""
import uuid
from datetime import date
from condition_api.models.amendment import Amendment
from condition_api.models.db import db
from condition_api.utils.enums import DocumentType

class AmendmentService:
    """Service for managing amendment-related operations."""

    @staticmethod
    def create_amendment(document_id, amendment):
        amended_document_id = amendment.get("amended_document_id")
        if not amended_document_id:
            # Generate a random ID using UUID and convert it to a string
            amended_document_id = uuid.uuid4().hex

        date_issued = amendment.get("date_issued")
        if not date_issued:
            date_issued = date.today()

        new_amendment = Amendment(
            document_id=document_id,
            date_issued=date_issued,
            amended_document_id=amended_document_id,
            amendment_name=amendment.get("amendment_name"),
            amendment_link=amendment.get("amendment_link"),
            document_type_id=DocumentType.Amendment
        )
        db.session.add(new_amendment)
        db.session.flush()

        db.session.commit()
        return new_amendment
