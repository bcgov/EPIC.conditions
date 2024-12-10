"""Service for condition management."""
from sqlalchemy import case, func, extract
from sqlalchemy.orm import aliased
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

class ConditionService:
    """Service for managing condition-related operations."""

    @staticmethod
    def get_condition_details(project_id, document_id, condition_number):
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

        condition_data = (
            db.session.query(
                projects.project_name,
                document_categories.category_name.label('document_category'),
                extract('year', documents.date_issued).label('year_issued'),
                documents.document_label,
                conditions.id,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.is_topic_tags_approved,
                conditions.is_condition_attributes_approved,
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
            .outerjoin(
                documents,
                conditions.document_id == documents.document_id
            )
            .outerjoin(
                document_types,
                document_types.id == documents.document_type_id
            )
            .outerjoin(
                document_categories,
                document_categories.id == document_types.document_category_id
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
        document_category = condition_data[0].document_category if condition_data else None
        document_label = condition_data[0].document_label if condition_data else None

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
                ~condition_attributes.attribute_key_id.in_([2, 4])
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
            "document_category": document_category,
            "document_label": document_label,
            "condition": condition
        }


    @staticmethod
    def get_all_conditions(project_id, document_id):
        """Fetch all conditions and their related subconditions by project ID and document ID."""

        # Aliases for the tables
        projects = aliased(Project)
        documents = aliased(Document)
        document_types = aliased(DocumentType)
        document_categories = aliased(DocumentCategory)
        amendments = aliased(Amendment)
        conditions = aliased(Condition)
        subconditions = aliased(Subcondition)

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

        # Check if the document_id exists in the amendments table
        amendment_exists = (
            db.session.query(amendments.document_id, amendments.amended_document_id)
            .filter(amendments.amended_document_id == document_id)
            .first()
        )

        amendment_filter = None
        if amendment_exists:
            amendment_filter = amendments.amended_document_id == amendment_exists[1]

        if amendment_exists:
            # Join conditions to amendments instead of documents
            amendment_label_subquery = (
                db.session.query(amendments.amendment_name)
                .filter(amendments.amended_document_id == amendment_exists[1])
                .subquery()
            )
            document_filter = documents.id == amendment_exists[0]
            condition_join = amendments.amended_document_id == conditions.amended_document_id
            document_label_query = amendment_label_subquery.c.amendment_name.label("document_label")
            date_issued_query = extract("year", amendments.date_issued).label("year_issued")
        else:
            # Join conditions directly to documents
            document_filter = documents.document_id == document_id
            condition_join = documents.document_id == conditions.document_id
            document_label_query = documents.document_label
            date_issued_query = extract("year", documents.date_issued).label("year_issued")

        # Query for all conditions and their related subconditions and attributes
        condition_data = (
            db.session.query(
                projects.project_name,
                document_categories.category_name.label('document_category'),
                document_categories.id.label('document_category_id'),
                document_label_query,
                conditions.id.label('condition_id'),
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.subtopic_tags,
                amendment_subquery.c.amendment_names,
                subconditions.id.label('subcondition_id'),
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id,
                date_issued_query
            )
            .outerjoin(
                documents,
                documents.project_id == projects.project_id
            )
            .outerjoin(
                document_types,
                document_types.id == documents.document_type_id
            )
            .outerjoin(
                document_categories,
                document_categories.id == document_types.document_category_id
            )
            .outerjoin(
                amendments,
                amendments.document_id == documents.id
            )
            .outerjoin(
                conditions,
                condition_join
            )
            .outerjoin(
                subconditions,
                conditions.id == subconditions.condition_id,
            )
            .outerjoin(
                amendment_subquery,
                conditions.condition_number == amendment_subquery.c.condition_number
            )
            .filter(
                (projects.project_id == project_id) & document_filter,
                *([amendment_filter] if amendment_filter else [])
            )
            .group_by(
                projects.project_name,
                document_categories.category_name,
                document_categories.id,
                conditions.id,
                conditions.condition_name,
                conditions.condition_number,
                conditions.condition_text,
                conditions.is_approved,
                conditions.topic_tags,
                conditions.subtopic_tags,
                subconditions.id,
                subconditions.subcondition_identifier,
                subconditions.subcondition_text,
                subconditions.parent_subcondition_id,
                amendment_subquery.c.amendment_names,
                date_issued_query,
                document_label_query
            )
            .all()
        )

        conditions_map = {}
        subcondition_map = {}

        project_name = condition_data[0].project_name if condition_data else None
        document_category = condition_data[0].document_category if condition_data else None
        document_category_id = condition_data[0].document_category_id if condition_data else None
        document_label = condition_data[0].document_label if condition_data else None

        # Process the query result
        for row in condition_data:
            cond_num = row.condition_number

            # Add each condition to the map if not already present
            if cond_num not in conditions_map:
                conditions_map[cond_num] = {
                    "condition_id": row.condition_id,
                    "condition_name": row.condition_name,
                    "condition_number": row.condition_number,
                    "condition_text": row.condition_text,
                    "is_approved": row.is_approved,
                    "topic_tags": row.topic_tags,
                    "subtopic_tags": row.subtopic_tags,
                    "amendment_names": row.amendment_names,
                    "year_issued": row.year_issued,
                    "condition_attributes": [],
                    "subconditions": []
                }

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
            "document_category": document_category,
            "document_category_id": document_category_id,
            "document_label": document_label,
            "conditions": list(conditions_map.values())
        }


    @staticmethod
    def update_condition(project_id, document_id, condition_number, conditions_data):
        """Update the approved status, topic tags, and subconditions of a specific condition."""
        condition = db.session.query(Condition).filter_by(
            project_id=project_id, document_id=document_id, condition_number=condition_number
            ).first()

        if "topic_tags" in conditions_data and not condition.is_topic_tags_approved:
            condition.topic_tags = conditions_data.get("topic_tags")

        if "is_topic_tags_approved" in conditions_data:
            condition.is_topic_tags_approved = conditions_data.get("is_topic_tags_approved")

        if "is_condition_attributes_approved" in conditions_data:
            condition.is_condition_attributes_approved = conditions_data.get("is_condition_attributes_approved")

        if conditions_data.get("subconditions"):
            existing_subcondition_ids = [
                subcond["subcondition_id"] for subcond in conditions_data["subconditions"]
                if isinstance(subcond["subcondition_id"], str) and "-" not in subcond["subcondition_id"]
            ]
            db.session.query(Subcondition).filter(
                Subcondition.condition_id == condition.id,
                Subcondition.id.notin_(existing_subcondition_ids)
            ).delete(synchronize_session=False)
            ConditionService.upsert_subconditions(
                condition.id, conditions_data.get("subconditions"), None)

        db.session.commit()
        return condition


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
    def create_condition(project_id, document_id):
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
        else:
            final_document_id = document_id

        new_condition = Condition(
            document_id=final_document_id ,
            amended_document_id=amended_document_id,
            project_id=project_id,
            is_approved=False
        )
        db.session.add(new_condition)
        db.session.flush()

        db.session.commit()

        return {
            "condition_id": new_condition.id
        }

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
                    Document.document_id,
                    Amendment.amendment_name.label("document_label"),
                    extract("year", Amendment.date_issued).label("year_issued")
                )
                .outerjoin(
                    Document,
                    Document.id == Amendment.document_id
                )
                .filter(Amendment.amended_document_id == amended_document_id)
                .first()
            )
            document_id = amendment_data.document_id if amendment_data else None
            document_label = amendment_data.document_label if amendment_data else None
            year_issued = amendment_data.year_issued if amendment_data else None
        else:
            document_id = condition_data.document_id
            document_details = db.session.query(
                Document.document_label,
                extract("year", Document.date_issued).label("year_issued")
            ).filter(Document.document_id == document_id).first()

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
        ).filter(Document.document_id == document_id).first()

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
            "topic_tags": condition_data.topic_tags,
            "subtopic_tags": condition_data.subtopic_tags,
            "year_issued": year_issued,
            "condition_attributes": [],
            "subconditions": []
        }

        return {
            "project_id": project_id,
            "project_name": project_name,
            "document_category_id": document_category_id,
            "document_category": document_category,
            "document_id": document_id,
            "document_label": document_label,
            "condition": condition_details
        }
