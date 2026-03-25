"""Service for extraction request management."""
from condition_api.models.db import db
from condition_api.models.document import Document
from condition_api.models.extraction_request import ExtractionRequest
from condition_api.models.project import Project


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
            s3_url=data['s3_url'],
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
