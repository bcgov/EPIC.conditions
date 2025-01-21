"""Service for condition attribute management."""
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.db import db
from condition_api.utils.enums import AttributeKeys


class AttributeKeyNotFoundError(Exception):
    """Custom exception for missing attribute key."""
    def __init__(self, key_name):
        super().__init__(f"Attribute key '{key_name}' does not exist.")
        self.key_name = key_name


class ConditionAttributeService:
    """Service for managing condition-attribute related operations."""

    @staticmethod
    def upsert_condition_attribute(condition_id, attributes):
        """
        Updates or inserts condition attributes for a given condition.

        :param condition_id: ID of the condition.
        :param attributes: List of attribute dictionaries containing 'id', 'key', and 'value'.
        :return: List of updated or inserted attributes.
        """
        updated_or_inserted_attributes = []

        def add_to_result_list(attribute_id, attribute_key_id, attribute_key_name, attribute_value):
            """Adds an attribute to the result list if it's not already present."""
            if not any(attr["id"] == attribute_id for attr in updated_or_inserted_attributes):
                updated_or_inserted_attributes.append({
                    "id": attribute_id,
                    "key_id": attribute_key_id,
                    "key": attribute_key_name,
                    "value": attribute_value,
                })

        for attribute in attributes:
            condition_attribute_id = attribute.get("id")
            attribute_key_name = attribute.get("key")

            # Validate and fetch the AttributeKey
            attribute_key_entry = db.session.query(AttributeKey).filter_by(key_name=attribute_key_name).first()
            if not attribute_key_entry:
                raise AttributeKeyNotFoundError(attribute_key_name)

            attribute_key_id = attribute_key_entry.id

            # Fetch existing condition attribute
            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id, attribute_key_id=attribute_key_id
            ).first()

            if not existing_attribute and condition_attribute_id and "-" not in str(condition_attribute_id):
                existing_attribute = db.session.query(ConditionAttribute).filter_by(
                    id=condition_attribute_id
                ).first()

            if existing_attribute:
                # Update the existing attribute
                existing_attribute.attribute_value = attribute.get("value")
                add_to_result_list(
                    existing_attribute.id,
                    attribute_key_id,
                    attribute_key_name,
                    existing_attribute.attribute_value
                )
            else:
                # Create a new attribute
                new_condition_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=attribute_key_id,
                    attribute_value=attribute.get("value")
                )
                db.session.add(new_condition_attribute)
                db.session.flush()  # Ensure ID is generated
                add_to_result_list(
                    new_condition_attribute.id,
                    attribute_key_id,
                    attribute_key_name,
                    new_condition_attribute.attribute_value
                )

            # Handle special logic for specific attributes
            ConditionAttributeService._handle_requires_management_plan(
                condition_id, attribute_key_id, attribute.get("value"), add_to_result_list
            )
            ConditionAttributeService._handle_requires_consultation(
                condition_id, attribute_key_id, attribute.get("value"), add_to_result_list
            )

        db.session.commit()

        # Sort the result list by the 'id' field before returning
        updated_or_inserted_attributes.sort(key=lambda attr: attr["key_id"])
        return updated_or_inserted_attributes

    @staticmethod
    def _handle_requires_management_plan(condition_id, attribute_key_id, attribute_value, add_to_result_list):
        """
        Handles additional attributes when REQUIRES_MANAGEMENT_PLAN is set to true.

        :param condition_id: ID of the condition.
        :param attribute_key_id: Key ID of the current attribute.
        :param attribute_value: Value of the current attribute.
        :param add_to_result_list: Function to add attributes to the result list.
        """
        if attribute_key_id == AttributeKeys.REQUIRES_MANAGEMENT_PLAN and attribute_value == 'true':
            ATTRIBUTE_KEY_IDS = [
                AttributeKeys.SUBMITTED_TO_EAO_FOR,
                AttributeKeys.MANAGEMENT_PLAN_NAME,
                AttributeKeys.MILESTONE_RELATED_TO_PLAN_SUBMISSION,
                AttributeKeys.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION,
                AttributeKeys.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE,
                AttributeKeys.REQUIRES_CONSULTATION,
            ]

            all_attribute_keys = db.session.query(AttributeKey).filter(AttributeKey.id.in_(ATTRIBUTE_KEY_IDS)).all()
            for key in all_attribute_keys:
                existing_attribute = db.session.query(ConditionAttribute).filter_by(
                    condition_id=condition_id, attribute_key_id=key.id
                ).first()

                if not existing_attribute:
                    # Check if the current key is MANAGEMENT_PLAN_NAME
                    attribute_value = '{}' if key.id == AttributeKeys.MANAGEMENT_PLAN_NAME else None
                    new_attribute = ConditionAttribute(
                        condition_id=condition_id,
                        attribute_key_id=key.id,
                        attribute_value=attribute_value
                    )
                    db.session.add(new_attribute)
                    db.session.flush()
                    add_to_result_list(new_attribute.id, key.id, key.key_name, new_attribute.attribute_value)

    @staticmethod
    def _handle_requires_consultation(condition_id, attribute_key_id, attribute_value, add_to_result_list):
        """
        Handles additional attributes when REQUIRES_CONSULTATION is set to true.

        :param condition_id: ID of the condition.
        :param attribute_key_id: Key ID of the current attribute.
        :param attribute_value: Value of the current attribute.
        :param add_to_result_list: Function to add attributes to the result list.
        """
        if attribute_key_id == AttributeKeys.REQUIRES_CONSULTATION and attribute_value == 'true':
            consultation_key = db.session.query(AttributeKey).filter(
                AttributeKey.id == AttributeKeys.PARTIES_REQUIRED_TO_BE_CONSULTED
            ).first()

            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id, attribute_key_id=consultation_key.id
            ).first()

            if not existing_attribute:
                new_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=consultation_key.id,
                    attribute_value='{}'
                )
                db.session.add(new_attribute)
                db.session.flush()
                add_to_result_list(
                    new_attribute.id,
                    consultation_key.id,
                    consultation_key.key_name,
                    new_attribute.attribute_value
                )
