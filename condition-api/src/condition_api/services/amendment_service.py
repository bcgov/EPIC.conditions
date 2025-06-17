"""Service for amendment management."""
import uuid
from datetime import date

from condition_api.models.amendment import Amendment
from condition_api.models.db import db
from condition_api.models.document import Document
from condition_api.utils.enums import DocumentType


class AmendmentService:
    """Service for managing amendment-related operations."""

    @staticmethod
    def create_amendment(document_id, amendment):
        """Create a new amendment document"""
        amended_document_id = amendment.get("amended_document_id")
        is_latest_amendment_added = amendment.get("is_latest_amendment_added")
        if not amended_document_id:
            # Generate a random ID using UUID and convert it to a string
            amended_document_id = uuid.uuid4().hex

        date_issued = amendment.get("date_issued")
        if not date_issued:
            date_issued = date.today()

        if is_latest_amendment_added:
            AmendmentService._update_document(document_id, is_latest_amendment_added)

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

    @staticmethod
    def _update_document(document_id, is_latest_amendment_added):
        """Update a SQLAlchemy model instance from a dictionary."""
        document = Document.get_by_id(document_id)
        if not document:
            raise ValueError(f"Document with ID {document_id} does not exist.")
        document.is_latest_amendment_added = is_latest_amendment_added
        db.session.flush()
