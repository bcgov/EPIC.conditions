"""Service for document management."""
from sqlalchemy import extract, func, case
from condition_api.models.amendment import Amendment
from condition_api.models.condition import Condition
from condition_api.models.document import Document
from condition_api.models.project import Project
from condition_api.models.db import db
from condition_api.utils.constants import DOCUMENT_TYPE_MAPPING

class DocumentService:
    """Service for managing document-related operations."""

    @staticmethod
    def get_documents_with_amendments(project_id, document_id):
        """Fetch a document and its amendments for the given project_id and document_id."""

        # Fetch the original document
        documents_query = db.session.query(
            Project.project_name.label('project_name'),
            case(
                (Document.document_type.in_(DOCUMENT_TYPE_MAPPING["Exemption Order and Amendments"]), 'Exemption Order and Amendments'),
                (Document.document_type.in_(DOCUMENT_TYPE_MAPPING["Certificate and Amendments"]), 'Certificate and Amendments'),
                else_=Document.document_type
            ).label('document_type'),
            Document.id.label('id'),
            Document.document_id.label('document_id'),
            Document.display_name.label('document_name'),
            extract('year', Document.date_issued).label('year_issued'),
            func.min(case((Condition.is_approved == False, 0), else_=1)).label('status')
        ).outerjoin(
            Project,
            Project.project_id == Document.project_id
        ).outerjoin(
            Condition,
            Condition.document_id == Document.document_id and Condition.amended_document_id is None
        ).filter(
            (Project.project_id == project_id)
            & (Document.document_id == document_id)
        ).group_by(
            Project.project_name, Document.document_type, Document.id, Document.document_id, Document.display_name, Document.date_issued
        ).all()

        if not documents_query:
            # If no original document is found, return an empty list
            return []

        # Fetch all amendments associated with the original document
        amendments_query = db.session.query(
            Amendment.amended_document_id.label('document_id'),
            Amendment.amendment_name.label('document_name'),
            extract('year', Amendment.date_issued).label('year_issued'),
            func.min(case((Condition.is_approved == False, 0), else_=1)).label('status')
        ).outerjoin(
            Condition,
            Condition.amended_document_id == Amendment.amended_document_id
        ).filter(
            Amendment.document_id == documents_query[0].id
        ).group_by(
            Amendment.amended_document_id, Amendment.amendment_name, Amendment.date_issued
        ).all()

        # Combine original document with amendments in the result
        result = []
        # Add original document
        result.append({
            'document_id': documents_query[0].document_id,
            'document_name': documents_query[0].document_name,
            'year_issued': documents_query[0].year_issued,
            'status': documents_query[0].status
        })
        # Add amendments (if any)
        for amendment in amendments_query:
            result.append({
                'document_id': amendment.document_id,
                'document_name': amendment.document_name,
                'year_issued': amendment.year_issued,
                'status': amendment.status
            })

        project_name = documents_query[0].project_name if documents_query else None
        document_type = documents_query[0].document_type if documents_query else None

        sorted_result = sorted(result, key=lambda x: x['year_issued'], reverse=True)
        return {
            "project_name": project_name,
            "document_type": document_type,
            "amendments": list(sorted_result)
        }
