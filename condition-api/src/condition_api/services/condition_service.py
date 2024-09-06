"""Service for condition management."""
from sqlalchemy.orm import aliased
from condition_api.models.condition import Condition
from condition_api.models.deliverable import Deliverable
from condition_api.models.db import db
from condition_api.models.project import Project

class ConditionService:
    """Service for managing condition-related operations."""

    @staticmethod
    def get_condition_details(project_id, document_id, condition_number):
        """Fetch condition details along with related deliverables by project ID."""

        # Aliases for the tables
        projects = aliased(Project)
        conditions = Condition
        deliverables = aliased(Deliverable)

        # Query the deliverables with associated conditions
        condition_data = (
            db.session.query(
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.deliverable_name,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.subtopic_tags,
                deliverables.deliverable_name,
                deliverables.is_plan,
                deliverables.approval_type,
                deliverables.stakeholders_to_consult,
                deliverables.stakeholders_to_submit_to,
                deliverables.fn_consultation_required,
                deliverables.related_phase,
                deliverables.days_prior_to_commencement,
            )
            .outerjoin(
                deliverables,
                conditions.id == deliverables.condition_id,
            )
            .outerjoin(
                projects,
                (projects.project_id == conditions.project_id)
                & (projects.document_id == conditions.document_id),
            )
            .filter(
                (projects.project_id == project_id)
                & (projects.document_id == document_id)
                & (conditions.condition_number == condition_number)
            )
            .all()
        )

        if not condition_data:
            return None

        # Extract condition details and deliverables
        condition = {
            "condition_name": condition_data[0].condition_name,
            "condition_number": condition_data[0].condition_number,
            "condition_text": condition_data[0].condition_text,
            "is_approved": condition_data[0].is_approved,
            "deliverable_name": condition_data[0].deliverable_name,
            "topic_tags": condition_data[0].topic_tags,
            "subtopic_tags": condition_data[0].subtopic_tags,
            "deliverables": []
        }

        # Append deliverables to the project
        for deliverable in condition_data:
            condition["deliverables"].append({
                "deliverable_name": deliverable.deliverable_name,
                "is_plan": deliverable.is_plan,
                "approval_type": deliverable.approval_type,
                "stakeholders_to_consult": deliverable.stakeholders_to_consult,
                "stakeholders_to_submit_to": deliverable.stakeholders_to_submit_to,
                "fn_consultation_required": deliverable.fn_consultation_required,
                "related_phase": deliverable.related_phase,
                "days_prior_to_commencement": deliverable.days_prior_to_commencement
            })

        return condition
