"""Service for condition management."""
from sqlalchemy import and_, case, func, extract
from sqlalchemy.orm import aliased
from condition_api.models.amendment import Amendment
from condition_api.models.condition import Condition
from condition_api.models.subcondition import Subcondition
from condition_api.models.condition_requirement import ConditionRequirement
from condition_api.models.document import Document
from condition_api.models.db import db
from condition_api.models.project import Project
from condition_api.utils.constants import DOCUMENT_TYPE_MAPPING

class ConditionService:
    """Service for managing condition-related operations."""

    @staticmethod
    def get_condition_details(project_id, document_id, condition_number):
        """Fetch condition details along with related condition requirements by project ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)
        condition_requirements = aliased(ConditionRequirement)

        condition_data = (
            db.session.query(
                projects.project_name,
                case(
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Exemption Order and Amendments"]), 'Exemption Order and Amendments'),
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Certificate and Amendments"]), 'Certificate and Amendments'),
                    else_=documents.document_type
                ).label('document_type'),
                extract('year', documents.date_issued).label('year_issued'),
                documents.display_name,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.is_topic_tags_approved,
                conditions.subtopic_tags,
                condition_requirements.deliverable_name,
                condition_requirements.is_plan,
                condition_requirements.approval_type,
                condition_requirements.stakeholders_to_consult,
                condition_requirements.stakeholders_to_submit_to,
                condition_requirements.consultation_required,
                condition_requirements.related_phase,
                condition_requirements.days_prior_to_commencement,
                condition_requirements.is_approved.label('condition_requirements_is_approved'),
                subconditions.id.label('subcondition_id'),
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id
            )
            .outerjoin(
                condition_requirements,
                and_(
                        conditions.id == condition_requirements.condition_id,
                        conditions.document_id == condition_requirements.document_id
                )
            )
            .outerjoin(
                subconditions,
                conditions.id == subconditions.condition_id,
            )
            .outerjoin(
                documents,
                conditions.document_id == documents.document_id
            )
            .outerjoin(
                projects,
                projects.project_id == documents.project_id
            )
            .filter(
                (projects.project_id == project_id)
                & (documents.document_id == document_id)
                & (conditions.condition_number == condition_number)
                & (conditions.is_active == True)
            )
            .order_by(subconditions.id)
            .all()
        )

        if not condition_data:
            return None

        project_name = condition_data[0].project_name if condition_data else None
        document_type = condition_data[0].document_type if condition_data else None
        display_name = condition_data[0].display_name if condition_data else None

        # Extract condition details
        condition = {
            "condition_name": condition_data[0].condition_name,
            "condition_number": condition_data[0].condition_number,
            "condition_text": condition_data[0].condition_text,
            "is_approved": condition_data[0].is_approved,
            "topic_tags": condition_data[0].topic_tags,
            "is_topic_tags_approved": condition_data[0].is_topic_tags_approved,
            "subtopic_tags": condition_data[0].subtopic_tags,
            "year_issued": condition_data[0].year_issued,
            "condition_requirements": [],
            "subconditions": []
        }

        subcondition_map = {}
        # Extract condition_requirements and subconditions
        for row in condition_data:
            subcond_id = row.subcondition_id
            # Handle the hierarchical subcondition structure
            if subcond_id:
                # Store each subcondition and its potential parent reference
                subcondition = {
                    "subcondition_id": row.subcondition_id,
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
                    "is_approved": row.condition_requirements_is_approved
                })

        return {
            "project_name": project_name,
            "document_type": document_type,
            "display_name": display_name,
            "condition": condition
        }


    @staticmethod
    def get_all_conditions(project_id, document_id):
        """Fetch all conditions and their related subconditions by project ID and document ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        amendments = aliased(Amendment)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)
        condition_requirements = aliased(ConditionRequirement)

        amendment_subquery = (
            db.session.query(
                conditions.condition_number,
                func.string_agg(amendments.amendment_name.distinct(), ', ').label('amendment_names')
            )
            .join(conditions, conditions.amended_document_id == amendments.amended_document_id)  # Join amendments to conditions
            .join(documents, conditions.document_id == documents.document_id)  # Join conditions to documents
            .join(projects, projects.project_id == documents.project_id)  # Join documents to projects
            .filter(
                (projects.project_id == project_id) & (documents.document_id == document_id)
            )
            .group_by(conditions.condition_number)
            .subquery()
        )

        # Query for all conditions and their related subconditions and requirements
        condition_data = (
            db.session.query(
                projects.project_name,
                case(
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Exemption Order and Amendments"]), 'Exemption Order and Amendments'),
                    (documents.document_type.in_(DOCUMENT_TYPE_MAPPING["Certificate and Amendments"]), 'Certificate and Amendments'),
                    else_=documents.document_type
                ).label('document_type'),
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.subtopic_tags,
                amendment_subquery.c.amendment_names,
                condition_requirements.deliverable_name,
                condition_requirements.is_plan,
                condition_requirements.approval_type,
                condition_requirements.stakeholders_to_consult,
                condition_requirements.stakeholders_to_submit_to,
                condition_requirements.consultation_required,
                condition_requirements.related_phase,
                condition_requirements.days_prior_to_commencement,
                subconditions.id.label('subcondition_id'),
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id,
                extract('year', documents.date_issued).label('year_issued')
            )
            .outerjoin(
                condition_requirements,
                and_(
                    conditions.id == condition_requirements.condition_id,
                    conditions.document_id == condition_requirements.document_id
                )
            )
            .outerjoin(
                subconditions,
                conditions.id == subconditions.condition_id,
            )
            .outerjoin(
                documents,
                conditions.document_id == documents.document_id
            )
            .outerjoin(
                projects,
                projects.project_id == documents.project_id
            )
            .outerjoin(
                amendment_subquery,
                conditions.condition_number == amendment_subquery.c.condition_number
            )
            .filter(
                (projects.project_id == project_id)
                & (documents.document_id == document_id)
                & (conditions.is_active == True)
            )
            .group_by(
                projects.project_name,
                documents.document_type,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.subtopic_tags,
                condition_requirements.deliverable_name,
                condition_requirements.is_plan,
                condition_requirements.approval_type,
                condition_requirements.stakeholders_to_consult,
                condition_requirements.stakeholders_to_submit_to,
                condition_requirements.consultation_required,
                condition_requirements.related_phase,
                condition_requirements.days_prior_to_commencement,
                subconditions.id,
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id,
                amendment_subquery.c.amendment_names,
                documents.date_issued
            )
            .all()
        )

        if not condition_data:
            return None

        conditions_map = {}
        subcondition_map = {}

        project_name = condition_data[0].project_name if condition_data else None
        document_type = condition_data[0].document_type if condition_data else None

        # Process the query result
        for row in condition_data:
            cond_num = row.condition_number

            # Add each condition to the map if not already present
            if cond_num not in conditions_map:
                conditions_map[cond_num] = {
                    "condition_name": row.condition_name,
                    "condition_number": row.condition_number,
                    "condition_text": row.condition_text,
                    "is_approved": row.is_approved,
                    "topic_tags": row.topic_tags,
                    "subtopic_tags": row.subtopic_tags,
                    "amendment_names": row.amendment_names,
                    "year_issued": row.year_issued,
                    "condition_requirements": [],
                    "subconditions": []
                }

            # Add condition requirements
            if row.deliverable_name:
                conditions_map[cond_num]["condition_requirements"].append({
                    "deliverable_name": row.deliverable_name,
                    "is_plan": row.is_plan,
                    "approval_type": row.approval_type,
                    "stakeholders_to_consult": row.stakeholders_to_consult,
                    "stakeholders_to_submit_to": row.stakeholders_to_submit_to,
                    "consultation_required": row.consultation_required,
                    "related_phase": row.related_phase,
                    "days_prior_to_commencement": row.days_prior_to_commencement
                })

            # Handle subconditions
            subcond_id = row.subcondition_id
            if subcond_id:
                subcondition = {
                    "subcondition_identifier": row.subcondition_identifier,
                    "subcondition_text": row.subcondition_text,
                    "subconditions": []
                }
                subcondition_map[subcond_id] = subcondition

                # If the subcondition has a parent, append it to the parent's subcondition list
                if row.parent_subcondition_id:
                    parent = subcondition_map.get(row.parent_subcondition_id)
                    if parent:
                        parent["subconditions"].append(subcondition)
                else:
                    # Top-level subcondition for this condition
                    conditions_map[cond_num]["subconditions"].append(subcondition)

        # Return all conditions
        return {
            "project_name": project_name,
            "document_type": document_type,
            "conditions": list(conditions_map.values())
        }


    @staticmethod
    def update_condition(project_id, document_id, condition_number, conditions_data):
        """Update the approved status of a specific condition topic tag."""
        condition = db.session.query(Condition).filter_by(
            project_id=project_id, document_id=document_id, condition_number=condition_number
            ).first()
        if "topic_tags" in conditions_data:
            condition.topic_tags = conditions_data.get("topic_tags")
        if "is_topic_tags_approved" in conditions_data:
            condition.is_topic_tags_approved = conditions_data.get("is_topic_tags_approved")
        db.session.commit()
        return condition
