"""Service for project management."""
from sqlalchemy import and_
from sqlalchemy.orm import aliased
from condition_api.models.condition import Condition
from condition_api.models.subcondition import Subcondition
from condition_api.models.condition_requirement import ConditionRequirement
from condition_api.models.document import Document
from condition_api.models.db import db
from condition_api.models.project import Project


class ProjectService:
    """Project management service."""

    @staticmethod
    def get_project_details(project_id):
        """Fetch project details along with related documents, conditions, subconditions, and condition requirements by project ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)
        condition_requirements = aliased(ConditionRequirement)

        # Query the project with associated documents, conditions, subconditions, and condition requirements
        project_data = (
            db.session.query(
                projects.project_id,
                projects.project_name,
                documents.document_id,
                documents.display_name,
                documents.document_file_name,
                conditions.id.label('condition_id'),
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.topic_tags,
                conditions.subtopic_tags,
                subconditions.id.label('subcondition_id'),
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id,
                condition_requirements.deliverable_name,
                condition_requirements.is_plan,
                condition_requirements.approval_type,
                condition_requirements.stakeholders_to_consult,
                condition_requirements.stakeholders_to_submit_to,
                condition_requirements.consultation_required,
                condition_requirements.related_phase,
                condition_requirements.days_prior_to_commencement,
            )
            .outerjoin(documents, projects.project_id == documents.project_id)
            .outerjoin(conditions, (documents.document_id == conditions.document_id))
            .outerjoin(subconditions, (conditions.id == subconditions.condition_id))
            .outerjoin(condition_requirements,
                        and_(
                                conditions.id == condition_requirements.condition_id,
                                conditions.document_id == condition_requirements.document_id
                            )
                       )
            .filter(projects.project_id == project_id)
            .all()
        )

        if not project_data:
            return None

        # Extract project details and initialize the project structure
        project = {
            "project_id": project_data[0].project_id,
            "project_name": project_data[0].project_name,
            "documents": [],
        }

        # Organize data into hierarchical structure
        document_map = {}
        subcondition_map = {}

        for row in project_data:
            doc_id = row.document_id
            cond_id = row.condition_id
            subcond_id = row.subcondition_id

            # Add documents to project if not already present
            if doc_id not in document_map:
                document_map[doc_id] = {
                    "document_id": doc_id,
                    "display_name": row.display_name,
                    "document_file_name": row.document_file_name,
                    "conditions": [],
                }
                project["documents"].append(document_map[doc_id])

            condition_map = {c["condition_id"]: c for c in document_map[doc_id]["conditions"]}

            # Add conditions to the document
            if cond_id not in condition_map:
                condition_map[cond_id] = {
                    "condition_id": cond_id,
                    "condition_name": row.condition_name,
                    "condition_number": row.condition_number,
                    "condition_text": row.condition_text,
                    "topic_tags": row.topic_tags,
                    "subtopic_tags": row.subtopic_tags,
                    "subconditions": [],
                    "condition_requirements": [],
                }
                document_map[doc_id]["conditions"].append(condition_map[cond_id])

            condition = condition_map[cond_id]

            # Handle the hierarchical subcondition structure
            if subcond_id:
                # Store each subcondition and its potential parent reference
                subcondition = {
                    "subcondition_id": subcond_id,
                    "subcondition_identifier": row.subcondition_identifier,
                    "subcondition_text": row.subcondition_text,
                    "subconditions": [],
                }
                subcondition_map[subcond_id] = subcondition

                # If the subcondition has a parent, append it to the parent's subcondition list
                if row.parent_subcondition_id:
                    parent = subcondition_map.get(row.parent_subcondition_id)
                    if parent:
                        parent["subconditions"].append(subcondition)
                else:
                    # If there is no parent, it's a top-level subcondition for this condition
                    condition["subconditions"].append(subcondition)

            # Add condition requirements to the condition
            if row.deliverable_name:
                condition["condition_requirements"].append({
                    "deliverable_name": row.deliverable_name,
                    "is_plan": row.is_plan,
                    "approval_type": row.approval_type,
                    "stakeholders_to_consult": row.stakeholders_to_consult,
                    "stakeholders_to_submit_to": row.stakeholders_to_submit_to,
                    "consultation_required": row.consultation_required,
                    "related_phase": row.related_phase,
                    "days_prior_to_commencement": row.days_prior_to_commencement,
                })

        return project
