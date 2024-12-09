"""Service for document management."""
import uuid
from datetime import date
from sqlalchemy import extract, func, case
from condition_api.models.amendment import Amendment
from condition_api.models.condition import Condition
from condition_api.models.document import Document
from condition_api.models.document_category import DocumentCategory
from condition_api.models.document_type import DocumentType
from condition_api.models.project import Project
from condition_api.models.db import db

class DocumentService:
    """Service for managing document-related operations."""

    @staticmethod
    def get_all_documents_by_category(project_id, category_id):
        """Fetch all documents and its amendments for the given project_id and category_id."""

        # Fetch the original document
        documents = db.session.query(
            Project.project_name.label('project_name'),
            DocumentCategory.category_name.label('document_category'),
            Document.id.label('id'),
            Document.document_id.label('document_id'),
            Document.document_label.label('document_label'),
            extract('year', Document.date_issued).label('year_issued'),
            case(
                (func.count(Condition.id) == 0, None),
                else_=func.min(case((Condition.is_approved == False, 0), else_=1)),
            ).label("status")
        ).outerjoin(
            Project,
            Project.project_id == Document.project_id
        ).outerjoin(
            DocumentType,
            DocumentType.id == Document.document_type_id
        ).outerjoin(
            DocumentCategory,
            DocumentCategory.id == DocumentType.document_category_id
        ).outerjoin(
            Condition,
            Condition.document_id == Document.document_id and Condition.amended_document_id is None
        ).filter(
            (Project.project_id == project_id)
            & (DocumentCategory.id == category_id)
        ).group_by(
            Project.project_name,
            DocumentCategory.category_name,
            Document.id,
            Document.document_id,
            Document.document_label,
            Document.date_issued
        ).all()

        if not documents:
            # If no original document is found, return an empty list
            return []

        # Combine original document with amendments in the result
        result = []

        # Iterate over documents and fetch amendments
        for document in documents:
        # Fetch all amendments associated with the original document
            amendments_query = db.session.query(
                Amendment.amended_document_id.label('document_id'),
                Amendment.amendment_name.label('document_label'),
                extract('year', Amendment.date_issued).label('year_issued'),
                case(
                    (func.count(Condition.id) == 0, None),
                    else_=func.min(case((Condition.is_approved == False, 0), else_=1)),
                ).label("status")
            ).outerjoin(
                Condition,
                Condition.amended_document_id == Amendment.amended_document_id
            ).filter(
                Amendment.document_id == document.id
            ).group_by(
                Amendment.amended_document_id, Amendment.amendment_name, Amendment.date_issued
            ).all()

            # Append the main document to the result list
            result.append({
                'document_id': document.document_id,
                'document_label': document.document_label,
                'year_issued': document.year_issued,
                'status': document.status
            })

            # Append all amendments for the current document
            for amendment in amendments_query:
                result.append({
                    'document_id': amendment.document_id,
                    'document_label': amendment.document_label,
                    'year_issued': amendment.year_issued,
                    'status': amendment.status
                })

        project_name = documents[0].project_name if documents else None
        document_category = documents[0].document_category if documents else None

        sorted_result = sorted(result, key=lambda x: x['year_issued'], reverse=True)
        return {
            "project_name": project_name,
            "document_category": document_category,
            "documents": list(sorted_result)
        }

    @staticmethod
    def create_document(project_id, document):
        document_id = document.get("document_id")
        if not document_id:
            # Generate a random ID using UUID and convert it to a string
            document_id = uuid.uuid4().hex

        date_issued = document.get("date_issued")
        if not date_issued:
            date_issued = date.today()

        new_document = Document(
            document_id=document_id,
            date_issued=date_issued,
            project_id=project_id,
            document_label=document.get("document_label"),
            document_link=document.get("document_link"),
            document_type_id=document.get("document_type_id")
        )
        db.session.add(new_document)
        db.session.flush()

        db.session.commit()
        return new_document

    @staticmethod
    def get_all_documents_by_project_id(project_id):
        """Fetch all documents and its amendments for the given project_id."""
        documents = db.session.query(
            Document.id.label('document_id'),
            Document.document_label
        ).outerjoin(
            Project,
            Project.project_id == Document.project_id
        ).filter(
            Project.project_id == project_id
        )

        if not documents:
            # If no original document is found, return an empty list
            return []
        
        result = []

        for document in documents:
            result.append({
                'document_id': document.document_id,
                'document_label': document.document_label
            })

        return result
