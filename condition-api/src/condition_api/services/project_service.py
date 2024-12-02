"""Service for project management."""
from sqlalchemy import func, case, String
from sqlalchemy.dialects.postgresql import ARRAY
from condition_api.models.amendment import Amendment
from condition_api.models.condition import Condition
from condition_api.models.document import Document
from condition_api.models.document_category import DocumentCategory
from condition_api.models.document_type import DocumentType
from condition_api.models.db import db
from condition_api.models.project import Project


class ProjectService:
    """Project management service."""

    @staticmethod
    def get_all_projects():
        """Fetch all projects along with related documents in a single query."""

        # Fetch all projects with their related documents, document types, and conditions in one query
        project_data = (
            db.session.query(
                Project.project_id,
                Project.project_name,
                DocumentCategory.id.label("document_category_id"),
                DocumentCategory.category_name.label("document_category"),
                func.array_agg(func.distinct(DocumentType.document_type), type_=ARRAY(String)).label("document_types"),
                func.max(Document.date_issued).label("date_issued"),
                # Check if all related conditions are approved
                case(
                    (func.count(Condition.id) == 0, None),
                    else_=func.min(case((Condition.is_approved == False, 0), else_=1)),
                ).label("all_approved"),
                # Count amendments related to each document
                func.count(Amendment.document_id).label("amendment_count"),
            )
            .outerjoin(Document, Document.project_id == Project.project_id)
            .outerjoin(DocumentType, DocumentType.id == Document.document_type_id)
            .outerjoin(DocumentCategory, DocumentCategory.id == DocumentType.document_category_id)
            .outerjoin(Condition, Condition.document_id == Document.document_id)
            .outerjoin(Amendment, Amendment.document_id == Document.id)
            .group_by(
                Project.project_id,
                Project.project_name,
                DocumentCategory.id,
                DocumentCategory.category_name
            )
        ).all()

        if not project_data:
            return None

        # Transform query results into the desired structure
        projects_map = {}
        for row in project_data:
            project_id = row.project_id
            if project_id not in projects_map:
                projects_map[project_id] = {
                    "project_id": project_id,
                    "project_name": row.project_name,
                    "documents": [],
                }

            if row.document_category_id:  # Ensure there's a document category id associated
                projects_map[project_id]["documents"].append({
                    "document_category_id": row.document_category_id,
                    "document_category": row.document_category,
                    "document_types": row.document_types,
                    "date_issued": row.date_issued,
                    "status": row.all_approved,
                    "amendment_count": row.amendment_count,
                })

        # Convert the map to a list of projects
        result = list(projects_map.values())
        return result
