"""Service for project management."""
from sqlalchemy.orm import aliased
from condition_api.models.condition import Condition
from condition_api.models.db import db
from condition_api.models.project import Project


class ProjectService:
    """Project management service."""

    @staticmethod
    def get_project_details(project_id):
        """Fetch project details along with related conditions by project ID."""

        # Aliases for the tables
        projects = aliased(Project)
        conditions = aliased(Condition)

        # Query the project with associated conditions
        project_data = (db.session.query(
                    projects.project_id,
                    projects.project_name,
                    projects.document_id,
                    projects.display_name,
                    projects.document_file_name,
                    conditions.condition_name,
                    conditions.condition_number,
                    conditions.condition_text,
                    conditions.deliverable_name,
                    conditions.topic_tags,
                    conditions.subtopic_tags)
                .outerjoin(conditions, 
                            (projects.project_id == conditions.project_id) & 
                            (projects.document_id == conditions.document_id))
                .filter(projects.project_id == project_id)
                .all())

        if not project_data:
            return None

        # Extract project details and conditions
        project = {
            "project_id": project_data[0].project_id,
            "project_name": project_data[0].project_name,
            "document_id": project_data[0].document_id,
            "display_name": project_data[0].display_name,
            "document_file_name": project_data[0].document_file_name,
            "conditions": []
        }

        # Append conditions to the project
        for condition in project_data:
            project["conditions"].append({
                "condition_name": condition.condition_name,
                "condition_number": condition.condition_number,
                "condition_text": condition.condition_text,
                "deliverable_name": condition.deliverable_name,
                "topic_tags": condition.topic_tags,
                "subtopic_tags": condition.subtopic_tags
            })

        return project
