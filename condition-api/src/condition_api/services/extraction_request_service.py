"""Service for extraction request management."""
import logging

from sqlalchemy.exc import SQLAlchemyError

from condition_api.models.db import db
from condition_api.models.document import Document
from condition_api.models.extraction_request import ExtractionRequest
from condition_api.models.project import Project

logger = logging.getLogger(__name__)


class ExtractionRequestService:
    """Service for managing extraction requests."""

    @staticmethod
    def create(data: dict) -> ExtractionRequest:
        """Create a new extraction request with status pending.

        Also activates the associated document and project so they are
        immediately visible in the repository while extraction processes.
        """
        request = ExtractionRequest(
            project_id=data['project_id'],
            document_id=data.get('document_id'),
            document_type_id=data.get('document_type_id'),
            document_label=data.get('document_label'),
            original_file_name=data.get('original_file_name'),
            s3_url=data['s3_url'],
            file_size_bytes=data.get('file_size_bytes'),
            status='pending',
        )
        db.session.add(request)

        # Activate the document so it appears in the repository immediately
        document_id = data.get('document_id')
        if document_id:
            document = db.session.query(Document).filter_by(document_id=document_id).first()
            if document:
                document.is_active = True

        # Activate the project so it is visible in the repository
        project = db.session.query(Project).filter_by(project_id=data['project_id']).first()
        if project:
            project.is_active = True

        db.session.commit()
        return request

    @staticmethod
    def get_all(status_filter=None):
        """Get extraction requests optionally filtered by status."""
        query = db.session.query(ExtractionRequest).order_by(ExtractionRequest.created_date.desc())
        if status_filter:
            query = query.filter(ExtractionRequest.status == status_filter)
        return query.all()

    @staticmethod
    def reject_request(request_id: int):
        """Reject an extraction request and purge its raw extracted JSON."""
        req = db.session.query(ExtractionRequest).filter_by(id=request_id).first()
        if not req:
            raise ValueError("ExtractionRequest not found")
        try:
            req.status = 'rejected'
            req.extracted_data = None
            req.error_message = None
            db.session.commit()
        except SQLAlchemyError as exc:
            db.session.rollback()
            logger.error("Failed to reject ExtractionRequest id=%s: %s", request_id, exc)
            raise ValueError("Failed to reject extraction request due to a database error.") from exc
        return req

    @staticmethod
    def import_request(request_id: int):
        """Import the extracted conditions, marking the request as imported."""
        req = db.session.query(ExtractionRequest).filter_by(id=request_id).first()
        if not req:
            raise ValueError("ExtractionRequest not found")
        if req.status != 'completed':
            raise ValueError("Request must be completed to import")
        if not req.document_id:
            raise ValueError("Request must reference an existing document to import")

        from condition_api.services.extraction_import_service import load_extracted_data

        try:
            load_extracted_data(
                data=req.extracted_data or {},
                project_id=req.project_id,
                document_id=req.document_id,
            )

            req.status = 'imported'
            req.extracted_data = None

            if req.document_id:
                document = db.session.query(Document).filter_by(document_id=req.document_id).first()
                if document:
                    document.is_active = True

            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return req
