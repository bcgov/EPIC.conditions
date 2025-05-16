"""Service for condition management."""
import re
from datetime import datetime
from sqlalchemy import and_, case, func, extract
from sqlalchemy.orm import aliased
from condition_api.exceptions import ConditionNumberExistsError, ConditionNumberExistsInProjectError
from condition_api.models.amendment import Amendment
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition import Condition
from condition_api.models.subcondition import Subcondition
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.document import Document
from condition_api.models.document_type import DocumentType
from condition_api.models.document_category import DocumentCategory
from condition_api.models.db import db
from condition_api.models.project import Project
from condition_api.schemas.condition import ProjectDocumentConditionSchema, ConsolidatedConditionSchema
from condition_api.utils.enums import AttributeKeys

class ConditionService:
    """Service for managing condition-related operations."""

    @staticmethod
    def get_condition_details(project_id, document_id, condition_id):
        """Fetch condition details along with related condition attributes by project ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        document_types = aliased(DocumentType)
        document_categories = aliased(DocumentCategory)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)
        condition_attributes = aliased(ConditionAttribute)
        attribute_keys = aliased(AttributeKey)
        amendments = aliased(Amendment)

        # Check if the document_id exists in the amendments table
        amendment_exists = (
            db.session.query(amendments.document_id, amendments.amended_document_id)
            .filter(amendments.amended_document_id == document_id)
            .first()
        )

        if amendment_exists:
            document_join = (amendments.amended_document_id == conditions.amended_document_id)
            document_type_join = (amendments.document_type_id == document_types.id)
            date_issued_query = extract("year", amendments.date_issued).label("year_issued")
            amendment_label_subquery = (
                db.session.query(amendments.amendment_name)
                .filter(amendments.amended_document_id == amendment_exists[1])
                .subquery()
            )
            document_label_query = amendment_label_subquery.c.amendment_name.label("document_label")
            date_issued_query = extract("year", amendments.date_issued).label("year_issued")
        else:
            document_join = (documents.document_id == conditions.document_id)
            document_type_join = (documents.document_type_id == document_types.id)
            document_label_query = documents.document_label
            date_issued_query = extract("year", documents.date_issued).label("year_issued")

        condition_data = (
            db.session.query(
                document_types.document_category_id,
                document_categories.category_name.label('document_category'),
                document_label_query,
                conditions.id,
                date_issued_query,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.is_topic_tags_approved,
                conditions.is_condition_attributes_approved,
                conditions.is_standard_condition,
                conditions.subtopic_tags,
                subconditions.id.label('subcondition_id'),
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id
            )
            .outerjoin(
                subconditions,
                conditions.id == subconditions.condition_id,
            )
            .outerjoin(amendments if amendment_exists else documents, document_join)
            .outerjoin(
                document_types,
                document_type_join
            )
            .outerjoin(
                document_categories,
                document_categories.id == document_types.document_category_id
            )
            .filter(
                (
                    amendments.amended_document_id == amendment_exists[1]
                    if amendment_exists
                    else (
                        (documents.document_id == document_id) &
                        (conditions.amended_document_id.is_(None))
                    )
                )
                & (conditions.id == condition_id)
            )
            .order_by(subconditions.id)
            .all()
        )

        project_name_query = (
            db.session.query(projects.project_name)
            .filter(projects.project_id == project_id)
            .first()
        )

        if not condition_data:
            return None

        project_name = project_name_query[0] if project_name_query else None
        document_category = condition_data[0].document_category if condition_data else None
        document_label = condition_data[0].document_label if condition_data else None
        document_category_id = condition_data[0].document_category_id if condition_data else None

        # Extract condition details
        condition = {
            "condition_id": condition_data[0].id,
            "condition_name": condition_data[0].condition_name,
            "condition_number": condition_data[0].condition_number,
            "condition_text": condition_data[0].condition_text,
            "is_approved": condition_data[0].is_approved,
            "topic_tags": condition_data[0].topic_tags,
            "is_topic_tags_approved": condition_data[0].is_topic_tags_approved,
            "is_condition_attributes_approved": condition_data[0].is_condition_attributes_approved,
            "is_standard_condition": condition_data[0].is_standard_condition,
            "subtopic_tags": condition_data[0].subtopic_tags,
            "year_issued": condition_data[0].year_issued,
            "condition_attributes": [],
            "subconditions": []
        }

        subcondition_map = {}
        # Extract condition_attributes and subconditions
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

        attributes_data = (
            db.session.query(
                condition_attributes.id,
                attribute_keys.key_name,
                condition_attributes.attribute_value
            )
			.outerjoin(
                attribute_keys,
                condition_attributes.attribute_key_id == attribute_keys.id,
            )
            .filter(
                condition_attributes.condition_id == condition_data[0].id,
                ~condition_attributes.attribute_key_id.in_([5]) # exlucding Parties required to be submitted from attribute_keys
            )
            .order_by(condition_attributes.attribute_key_id)
            .all()
        )

        transformed_attributes = [
            {"id": record[0], "key": record[1], "value": record[2]}
            for record in attributes_data
        ]

        condition["condition_attributes"] = transformed_attributes if transformed_attributes else []

        return {
            "project_name": project_name,
            "document_category_id": document_category_id,
            "document_category": document_category,
            "document_label": document_label,
            "condition": condition
        }

    @staticmethod
    def get_all_conditions(
        project_id,
        document_id,
        include_condition_attributes=False,
        include_nested_conditions=False
    ):
        """Fetch all conditions and their related subconditions by project ID and document ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        amendments = aliased(Amendment)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)

        # Check if the document_id is an amendment
        is_amendment_document = (
            db.session.query(amendments.document_id, amendments.amended_document_id)
            .filter(amendments.amended_document_id == document_id)
            .first()
        )

        if is_amendment_document:
            # Join conditions to amendments instead of documents
            amendment_label_subquery = (
                db.session.query(amendments.amendment_name)
                .filter(amendments.amended_document_id == is_amendment_document[1])
                .subquery()
            )
            document_label_query = amendment_label_subquery.c.amendment_name.label("document_label")
            condition_join = amendments.amended_document_id == conditions.amended_document_id
            date_issued_query = extract("year", amendments.date_issued).label("year_issued")
        else:
            # Join conditions directly to documents
            condition_join = and_(
                documents.document_id == conditions.document_id,
                conditions.amended_document_id.is_(None)
            )
            document_label_query = documents.document_label
            date_issued_query = extract("year", documents.date_issued).label("year_issued")

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

        # Query for all conditions and their related subconditions and attributes
        condition_data = (
            db.session.query(
                document_label_query,
                conditions.id.label('condition_id'),
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                case(
                    (
                        and_(
                            conditions.is_approved == True,  # Check if condition is approved
                            conditions.is_condition_attributes_approved == True,  # Check if attributes are approved
                            conditions.is_topic_tags_approved == True  # Check if topic tags are approved
                        ),
                        True  # All conditions are met
                    ),
                    else_=False  # At least one condition is not met
                ).label('is_approved'),  # Derived column for the calculated approval status
                conditions.is_standard_condition,
                conditions.topic_tags,
                conditions.subtopic_tags,
                amendment_subquery.c.amendment_names,
                date_issued_query
            )
            .outerjoin(
                conditions,
                condition_join
            )
            .outerjoin(
                amendment_subquery,
                conditions.condition_number == amendment_subquery.c.condition_number
            )
            .filter(
                (
                    (amendments.amended_document_id == is_amendment_document[1])
                    if is_amendment_document
                    else (documents.document_id == document_id and conditions.amended_document_id is None)
                )
            )
            .filter(
                ~and_(
                    conditions.condition_name.is_(None),
                    conditions.condition_number.is_(None)
                )
            )
            .group_by(
                conditions.id,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.is_condition_attributes_approved,
                conditions.is_topic_tags_approved,
                conditions.is_standard_condition,
                conditions.topic_tags,
                conditions.subtopic_tags,
                amendment_subquery.c.amendment_names,
                date_issued_query,
                document_label_query
            )
            .order_by(conditions.condition_number)
            .all()
        )

        conditions_map = {}
        subcondition_map = {}

        # Process the query result
        for row in condition_data:
            cond_id = row.condition_id

            # Add each condition to the map if not already present
            conditions_map[cond_id] = {
                "condition_id": row.condition_id,
                "condition_name": row.condition_name,
                "condition_number": row.condition_number,
                "condition_text": row.condition_text,
                "is_approved": row.is_approved,
                "is_standard_condition": row.is_standard_condition,
                "topic_tags": row.topic_tags,
                "subtopic_tags": row.subtopic_tags,
                "amendment_names": row.amendment_names,
                "year_issued": row.year_issued,
                "condition_attributes": [],
                "subconditions": []
            }

            if include_nested_conditions:
                subconditions_data = (
                    db.session.query(
                        subconditions.id.label('subcondition_id'),
                        subconditions.subcondition_identifier,
                        subconditions.subcondition_text,
                        subconditions.parent_subcondition_id
                    )
                    .filter(subconditions.condition_id == cond_id)
                )
                for row in subconditions_data:
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
                            conditions_map[cond_id]["subconditions"].append(subcondition)

        # Return all conditions
        return {
            "conditions": list(conditions_map.values())
        }

    @staticmethod
    def update_condition(
        conditions_data,
        project_id=None,
        document_id=None,
        condition_id=None,
        check_condition_exists=None,
        check_condition_over_project=None,
    ):
        """
        Update the approved status, topic tags, and subconditions of a specific condition.

        This method accepts either:
        1. project_id, document_id, and condition_id as input.
        """
        condition = db.session.query(Condition).filter_by(id=condition_id).first()

        if not condition:
            raise ValueError("Condition not found for the given condition ID.")

        condition_number = conditions_data.get("condition_number")

        if check_condition_exists:
            ConditionService._check_duplicate_condition_number(condition, condition_id, condition_number)

        if check_condition_over_project:
            ConditionService._check_condition_conflict_in_project(condition, condition_number)
        # Mark existing condition inactive if needed
        if condition.amended_document_id and not check_condition_over_project:
            ConditionService._deactivate_existing_condition(condition, condition_number)

        # Update condition fields
        if any(k != "subconditions" for k in conditions_data):
            ConditionService._update_from_dict(condition, conditions_data)

        # Handle subconditions
        if subconditions := conditions_data.get("subconditions"):
            ConditionService._update_subconditions(condition_id, subconditions)

        condition.commit()
        return condition

    @staticmethod
    def _check_duplicate_condition_number(condition, condition_id, condition_number):
        # Check if the same condition number exists in the same document or amendment
        query = db.session.query(Condition.condition_number).filter(
            Condition.id != condition_id
        )

        if condition.amended_document_id is None:
            query = query.filter(
                Condition.document_id == condition.document_id,
                Condition.amended_document_id.is_(None),
            )
        else:
            query = query.filter(
                Condition.amended_document_id == condition.amended_document_id
            )

        existing_numbers = [num[0] for num in query.all() if num[0] is not None]
        if condition_number in existing_numbers:
            raise ConditionNumberExistsError("This condition number already exists. Please enter a new one.")

    @staticmethod
    def _check_condition_conflict_in_project(condition, condition_number):
        query = db.session.query(
            Condition.condition_number, Condition.project_id, Condition.document_id, Condition.condition_name
        ).filter(
            Condition.project_id == condition.project_id,
            Condition.amended_document_id.is_(None),
        )

        condition_map = {
            c[0]: {"project_id": c[1], "document_id": c[2], "condition_name": c[3]}
            for c in query.all() if c[0] is not None
        }

        if condition_number in condition_map:
            meta = condition_map[condition_number]
            project = db.session.query(Project).filter_by(project_id=meta["project_id"]).first()
            document = db.session.query(Document).filter_by(document_id=meta["document_id"]).first()

            project_name = project.project_name if project else "Unknown Project"
            document_name = document.document_label if document else "Unknown Document"
            condition_name = meta.get("condition_name", "Unknown")

            if condition.amended_document_id:
                raise ConditionNumberExistsInProjectError(
                    f"Adding this condition will amend {condition_number}) {condition_name} in "
                    f"<b>{document_name}</b> of <b>{project_name}</b>.<br/><br/>Are you sure you wish to proceed?"
                )
            else:
                raise ConditionNumberExistsInProjectError(
                    f"This condition number already exists in <b>{document_name}</b> of "
                    f"<b>{project_name}</b>.<br/><br/>Are you sure you wish to proceed?"
                )

    @staticmethod
    def _deactivate_existing_condition(condition, condition_number):
        existing = db.session.query(Condition).filter(
            Condition.document_id == condition.document_id,
            Condition.condition_number == condition_number,
            Condition.amended_document_id.is_(None)
        ).first()

        if existing:
            existing.is_active = False
            existing.effective_to = datetime.utcnow()
            db.session.add(existing)

    @staticmethod
    def _update_subconditions(condition_id, subconditions):
        existing_ids = [
            sub["subcondition_id"]
            for sub in subconditions
            if isinstance(sub.get("subcondition_id"), str) and "-" not in sub["subcondition_id"]
        ]

        db.session.query(Subcondition).filter(
            Subcondition.condition_id == condition_id,
            Subcondition.id.notin_(existing_ids)
        ).delete(synchronize_session=False)

        ConditionService.upsert_subconditions(condition_id, subconditions, None)

    @staticmethod
    def _update_from_dict(condition_item: Condition, input_dict: dict):
        """Update a SQLAlchemy model instance from a dictionary."""
        if not isinstance(condition_item, Condition):
            raise TypeError(f"Expected a Condition model instance, got {type(condition_item).__name__}")

        allowed_list_keys = {"topic_tags", "subtopic_tags"}

        # Update only attributes that exist on the model
        for key, value in input_dict.items():
            if hasattr(condition_item, key):
                if key in allowed_list_keys:
                    setattr(condition_item, key, value)
                elif not isinstance(value, (list, dict)):
                    setattr(condition_item, key, value)

    @staticmethod
    def upsert_subconditions(condition_id, subconditions, parent_id=None):

        for subcond_data in subconditions:
            subcondition_id = subcond_data.get("subcondition_id")

            # Check if the subcondition exists
            if "-" in str(subcondition_id):
                existing_subcondition = False
            else:
                existing_subcondition = db.session.query(Subcondition).filter_by(
                    id=subcondition_id, condition_id=condition_id
                ).first()

            if existing_subcondition:
                # Update the existing subcondition
                existing_subcondition.subcondition_identifier = subcond_data.get("subcondition_identifier")
                existing_subcondition.subcondition_text = subcond_data.get("subcondition_text")
                existing_subcondition.parent_subcondition_id = parent_id
            else:
                # Insert a new subcondition
                new_subcondition = Subcondition(
                    condition_id=condition_id,
                    subcondition_identifier=subcond_data.get("subcondition_identifier"),
                    subcondition_text=subcond_data.get("subcondition_text"),
                    parent_subcondition_id=parent_id
                )
                db.session.add(new_subcondition)
                db.session.flush()  # Ensure we get the ID of the newly added subcondition

                # Set the ID for further nested subconditions
                subcondition_id = new_subcondition.id

            # Recursively handle child subconditions
            if "subconditions" in subcond_data:
                ConditionService.upsert_subconditions(
                    condition_id, subcond_data["subconditions"], parent_id=subcondition_id)

    @staticmethod
    def create_condition(project_id, document_id, conditions_data):
        """Create a new condition."""
        amendment = (
            db.session.query(Amendment.document_id)
            .filter(Amendment.amended_document_id == document_id)
            .first()
        )

        amended_document_id = document_id if amendment else None

        if amendment:
            document = (
                db.session.query(Document.document_id)
                .filter(Document.id == amendment[0])
                .first()
            )
            final_document_id = document[0]
            # Check if a condition exists with the given document_id and condition_number
            existing_condition = (
                db.session.query(Condition)
                .filter(
                    Condition.document_id == final_document_id,
                    Condition.condition_number == conditions_data.get("condition_number"),
                )
                .first()
            )

            # If it exists, update is_active to False
            if existing_condition:
                existing_condition.is_active = False
                existing_condition.effective_to = datetime.utcnow()
                db.session.add(existing_condition)
        else:
            final_document_id = document_id

        new_condition = Condition(
            document_id=final_document_id,
            amended_document_id=amended_document_id,
            project_id=project_id,
            is_approved=False,
            condition_name=conditions_data.get("condition_name"),
            condition_number=conditions_data.get("condition_number"),
            condition_text=conditions_data.get("condition_text"),
            is_standard_condition=conditions_data.get("is_standard_condition"),
            topic_tags=conditions_data.get("topic_tags"),
            subtopic_tags=conditions_data.get("subtopic_tags"),
            effective_from=datetime.utcnow()
        )
        db.session.add(new_condition)
        db.session.flush()

        if conditions_data.get("subconditions"):
            ConditionService.create_subconditions(
                new_condition.id, conditions_data.get("subconditions"), None)

        db.session.commit()

        return {
            "condition_id": new_condition.id
        }

    @staticmethod
    def create_subconditions(condition_id, subconditions, parent_id=None):
        for subcond_data in subconditions:
            new_subcondition = Subcondition(
                condition_id=condition_id,
                subcondition_identifier=subcond_data.get("subcondition_identifier"),
                subcondition_text=subcond_data.get("subcondition_text"),
                parent_subcondition_id=parent_id
            )
            db.session.add(new_subcondition)
            db.session.flush()

            subcondition_id = new_subcondition.id

            if "subconditions" in subcond_data:
                ConditionService.upsert_subconditions(
                    condition_id, subcond_data["subconditions"], parent_id=subcondition_id)

    @staticmethod
    def get_condition_details_by_id(condition_id):
        """Fetch all conditions and their related details by condition ID."""

        condition_data = (
            db.session.query(
                Condition.id,
                Condition.document_id,
                Condition.amended_document_id,
                Condition.condition_name,
                Condition.condition_number,
                Condition.condition_text,
                Condition.is_approved,
                Condition.is_standard_condition,
                Condition.topic_tags,
                Condition.subtopic_tags
            ).filter(Condition.id == condition_id).first()
        )

        if not condition_data:
            return None

        amended_document_id = condition_data.amended_document_id

        if amended_document_id:
            amendment_data = (
                db.session.query(
                    Amendment.amended_document_id,
                    Amendment.amendment_name.label("document_label"),
                    extract("year", Amendment.date_issued).label("year_issued")
                )
                .filter(Amendment.amended_document_id == amended_document_id)
                .first()
            )
            actual_document_id = amendment_data.amended_document_id if amendment_data else None
            document_label = amendment_data.document_label if amendment_data else None
            year_issued = amendment_data.year_issued if amendment_data else None
        else:
            actual_document_id = condition_data.document_id
            document_details = db.session.query(
                Document.document_label,
                extract("year", Document.date_issued).label("year_issued")
            ).filter(Document.document_id == actual_document_id).first()

            document_label = document_details.document_label if document_details else None
            year_issued = document_details.year_issued if document_details else None

        project_data = db.session.query(
            Project.project_id,
            Project.project_name,
            DocumentType.document_category_id,
            DocumentCategory.category_name.label("document_category")
        ).outerjoin(Document, Project.project_id == Document.project_id
        ).outerjoin(DocumentType, DocumentType.id == Document.document_type_id
        ).outerjoin(DocumentCategory, DocumentCategory.id == DocumentType.document_category_id
        ).filter(Document.document_id == condition_data.document_id).first()

        project_id = project_data.project_id if project_data else None
        project_name = project_data.project_name if project_data else None
        document_category = project_data.document_category if project_data else None
        document_category_id = project_data.document_category_id if project_data else None

        condition_details = {
            "condition_id": condition_data.id,
            "condition_name": condition_data.condition_name,
            "condition_number": condition_data.condition_number,
            "condition_text": condition_data.condition_text,
            "is_approved": condition_data.is_approved,
            "is_standard_condition": condition_data.is_standard_condition,
            "topic_tags": condition_data.topic_tags,
            "subtopic_tags": condition_data.subtopic_tags,
            "year_issued": year_issued,
            "condition_attributes": [],
            "subconditions": []
        }

        sub_condition_data = (
            db.session.query(
                Subcondition.id.label('subcondition_id'),
                Subcondition.subcondition_identifier,
                Subcondition.subcondition_text,
                Subcondition.parent_subcondition_id,
            ).filter(Subcondition.condition_id == condition_id).all()
        )

        subcondition_map = {}

        for row in sub_condition_data:
            subcond_id = row.subcondition_id
            if subcond_id:
                subcondition = {
                    "subcondition_id": row.subcondition_id,
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
                    condition_details["subconditions"].append(subcondition)

        return {
            "project_id": project_id,
            "project_name": project_name,
            "document_category_id": document_category_id,
            "document_category": document_category,
            "document_id": actual_document_id,
            "document_label": document_label,
            "condition": condition_details
        }

    @staticmethod
    def delete_condition(condition_id):
        """Remove condition data."""
        query = db.session.query(Condition).filter(Condition.id == condition_id)
        query.delete()
        db.session.commit()
        return None

    @staticmethod
    def get_consolidated_conditions(
        project_id,
        category_id=None,
        all_conditions=False,
        include_condition_attributes=False,
        include_nested_conditions=False,
        user_is_internal=False,
    ):
        """Fetch all consolidated conditions."""
        filter_condition = (
            Project.project_id == project_id
            if not user_is_internal or all_conditions
            else and_(
                Project.project_id == project_id,
                DocumentCategory.id == category_id,
            )
        )

        if user_is_internal:
            amendment_subquery = (
                db.session.query(
                    DocumentCategory.id,
                    Condition.condition_number,
                    func.string_agg(
                        Amendment.amendment_name.distinct(), ', '
                    ).label('amendment_names'),
                )
                .select_from(Project)
                .join(Document, Document.project_id == Project.project_id)
                .join(DocumentType, DocumentType.id == Document.document_type_id)
                .join(DocumentCategory, DocumentCategory.id == DocumentType.document_category_id)
                .join(Amendment, Amendment.document_id == Document.id)
                .join(Condition, Condition.amended_document_id == Amendment.amended_document_id)
                .filter(filter_condition)
                .group_by(DocumentCategory.id, Condition.condition_number)
                .subquery()
            )

        query = (
            db.session.query(
                Project.project_name,
                Document.id,
                Document.document_id,
                DocumentCategory.category_name,
                extract("year", Document.date_issued).label("year_issued"),
                Condition.id.label("condition_id"),
                Condition.condition_name,
                Condition.condition_number,
                Condition.condition_text,
                Condition.is_approved,
                Condition.topic_tags,
                Condition.is_condition_attributes_approved,
                Condition.is_topic_tags_approved,
                Condition.is_standard_condition,
                case(
                    (Condition.amended_document_id.isnot(None), Condition.amended_document_id),
                    else_=Condition.document_id,
                ).label("effective_document_id"),
                Document.document_label,
                Amendment.amendment_name
            )
            .join(Document, Document.project_id == Project.project_id)
            .join(DocumentType, DocumentType.id == Document.document_type_id)
            .join(DocumentCategory, DocumentCategory.id == DocumentType.document_category_id)
            .join(Condition, Condition.document_id == Document.document_id)
            .outerjoin(Amendment, Amendment.amended_document_id == Condition.amended_document_id)
            .filter(filter_condition)
            .filter(Condition.is_active == True)
        )

        if user_is_internal:
            query = query.add_columns(amendment_subquery.c.amendment_names.label("amendment_names"))
            query = query.outerjoin(
                amendment_subquery,
                and_(
                    Condition.condition_number == amendment_subquery.c.condition_number,
                    DocumentCategory.id == amendment_subquery.c.id
                ),
            )

        if not user_is_internal:
            query = query.filter(and_(Condition.is_approved == True,
                                      Condition.is_condition_attributes_approved == True,
                                      Condition.is_topic_tags_approved == True))

        query = query.filter(
            ~and_(
                Condition.condition_name.is_(None),
                Condition.condition_number.is_(None)
            )
        ).order_by(Condition.condition_number)

        condition_data = query.all()

        if not condition_data:
            return []
        
        if user_is_internal:
            return ConditionService._process_internal_conditions(condition_data, include_condition_attributes)
        else:
            return ConditionService._process_external_conditions(condition_data, include_condition_attributes)

    @staticmethod
    def _process_internal_conditions(condition_data, include_condition_attributes):
        """Process conditions for internal users."""
        conditions_map = {}

        for row in condition_data:
            conditions_map[row.condition_id] = {
                "condition_id": row.condition_id,
                "condition_name": row.condition_name,
                "condition_number": row.condition_number,
                "is_approved": row.is_approved,
                "is_standard_condition": row.is_standard_condition,
                "topic_tags": row.topic_tags,
                "amendment_names": row.amendment_names,
                "year_issued": row.year_issued,
                "effective_document_id": row.effective_document_id,
                "source_document": row.amendment_name if row.amendment_name else row.document_label
            }

        return ProjectDocumentConditionSchema().dump(
            {
                "project_name": condition_data[0].project_name,
                "document_category": condition_data[0].category_name,
                "conditions": list(conditions_map.values()),
            }
        )

    @staticmethod
    def _process_external_conditions(condition_data, include_condition_attributes):
        """Process conditions for external users."""
        result = []

        for row in condition_data:
            condition_attributes = (
                ConditionService._fetch_condition_attributes(
                    row.condition_id, include_condition_attributes)
            )
            result.append({
                "condition_name": row.condition_name,
                "condition_number": row.condition_number,
                "condition_text": row.condition_text,
                "is_standard_condition": row.is_standard_condition,
                "condition_attributes": condition_attributes,
            })

        conditions_schema = ConsolidatedConditionSchema(many=True)
        return {"conditions": conditions_schema.dump(result)}

    @staticmethod
    def _fetch_condition_attributes(condition_id, include_condition_attributes):
        """Fetch condition attributes based on the user type and flags."""
        if not include_condition_attributes:
            return []

        attributes_data = db.session.query(
            AttributeKey.id,
            AttributeKey.external_key,
            ConditionAttribute.attribute_value,
        ).outerjoin(
            AttributeKey, ConditionAttribute.attribute_key_id == AttributeKey.id
        ).filter(
            ConditionAttribute.condition_id == condition_id,
            ~ConditionAttribute.attribute_key_id.in_([5]), # exlucding Parties required to be submitted from attribute_keys
        ).order_by(ConditionAttribute.attribute_key_id).all()

        formatted_keys = {
            AttributeKeys.PARTIES_REQUIRED_TO_BE_CONSULTED,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_SUBMISSION,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION,
            AttributeKeys.MANAGEMENT_PLAN_NAME,
        }

        return {
            record[1]: (
                ConditionService.format_attribute_value(record[2])
                if record[0] in formatted_keys
                else (
                    record[2].replace("{", "").replace("}", "").replace('"', "")
                    if record[2] and record[2] != "N/A"
                    else None
                )
            )
            for record in attributes_data if record[1]  # Ensure record[1] is valid
        }

    @staticmethod
    def format_attribute_value(raw_value):
        if not raw_value or raw_value == "N/A":
            return None

        # Match values inside `{}` correctly, including those with escaped quotes
        matches = re.findall(r'"((?:[^"\\]|\\.)*)"|([^,{}]+)', raw_value)

        # Clean up extracted values (preserve quotes properly)
        clean_list = [
            (match[0].replace('\\"', '"').strip() if match[0] else match[1].strip())  # Handle escaped quotes properly
            for match in matches
        ]

        return clean_list  # Return as a proper JSON list (not a string!)
