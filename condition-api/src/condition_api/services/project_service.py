"""Service for project management."""
from sqlalchemy import func, case, select
from sqlalchemy.orm import aliased
from condition_api.models.amendment import Amendment
from condition_api.models.condition import Condition
from condition_api.models.document import Document
from condition_api.models.db import db
from condition_api.models.project import Project
from condition_api.utils.constants import DOCUMENT_TYPE_MAPPING


class ProjectService:
    """Project management service."""

    @staticmethod
    def get_all_projects():
        """Fetch all projects along with related documents."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        conditions = aliased(Condition)

        # Step 1: Fetch Projects
        project_data = db.session.query(
            projects.project_id,
            projects.project_name,
        ).all()

        if not project_data:
            return None

        # Step 2: Initialize the result list to store project data along with documents
        result = []

        # Subquery for counting amendments related to each document
        amendment_count_subquery = (
            select(func.count(Amendment.document_id))
            .where(Amendment.document_id == documents.id)
            .correlate(documents)
            .label("amendment_count")
        )

        # Step 3: Iterate over each project and fetch related documents
        for project in project_data:
            project_id = project.project_id

            # Fetch related documents for the current project
            document_data = db.session.query(
                documents.document_id,
                case(
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Exemption Order and Amendments"]), 'Exemption Order and Amendments'),
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Certificate and Amendments"]), 'Certificate and Amendments'),
                    else_=documents.document_type
                ).label('document_type'),
                documents.date_issued,
                documents.project_id,
                # Subquery to check if all related conditions have is_approved=True
                func.min(case((conditions.is_approved == False, 0), else_=1)).label('all_approved'),
                # Count of related amendments
                amendment_count_subquery
            ).outerjoin(conditions, conditions.document_id == documents.document_id
            ).filter(documents.project_id == project_id
            ).group_by(
                documents.id,
                documents.document_id,
                documents.document_type,
                documents.date_issued,
                documents.project_id
            ).all()

            # Create a document map for the current project
            document_map = {}
            project_documents = []

            for doc in document_data:
                status = bool(doc.all_approved)
                document_map[doc.document_id] = {
                    "document_id": doc.document_id,
                    "document_type": doc.document_type,
                    "date_issued": doc.date_issued,
                    "project_id": doc.project_id,
                    "status": status,
                    "amendment_count": doc.amendment_count,
                }
                # Append each document to the project's document array
                project_documents.append(document_map[doc.document_id])

            # Step 4: Append the project along with its documents to the result list
            result.append({
                "project_id": project.project_id,
                "project_name": project.project_name,
                "documents": project_documents
            })

        # Return the result containing all projects and their related documents
        return result
