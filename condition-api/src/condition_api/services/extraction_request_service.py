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

    @staticmethod
    def get_all(status_filter=None):
        """Get extraction requests optionally filtered by status."""
        query = db.session.query(ExtractionRequest).order_by(ExtractionRequest.created_date.desc())
        if status_filter:
            query = query.filter(ExtractionRequest.status == status_filter)
        return query.all()

    @staticmethod
    def reject_request(request_id: int):
        """Mark an extraction request as rejected."""
        req = db.session.query(ExtractionRequest).filter_by(id=request_id).first()
        if not req:
            raise ValueError("ExtractionRequest not found")
        db.session.delete(req)
        db.session.commit()
        return req

    @staticmethod
    def import_request(request_id: int):
        """Import the extracted conditions, marking the request as imported."""
        req = db.session.query(ExtractionRequest).filter_by(id=request_id).first()
        if not req:
            raise ValueError("ExtractionRequest not found")
        if req.status != 'completed':
            raise ValueError("Request must be completed to import")

        from condition_api.services.loader_service import load_extracted_data
        
        try:
            # 1. Load the data using the ported loader service logic
            load_extracted_data(req.extracted_data)
            
            # 2. Update status and purge raw JSON array now that the DB schema has it
            req.status = 'imported'
            req.extracted_data = None
            
            # 3. Ensure document is active immediately after import
            if req.document_id:
                document = db.session.query(Document).filter_by(document_id=req.document_id).first()
                if document:
                    document.is_active = True

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
        return req
