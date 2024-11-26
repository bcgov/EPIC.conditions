"""Service for condition attribute management."""
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.db import db

class AttributeKeyNotFoundError(Exception):
    """Custom exception for missing attribute key."""
    def __init__(self, key_name):
        super().__init__(f"Attribute key '{key_name}' does not exist.")
        self.key_name = key_name

class ConditionAttributeService:
    """Service for managing condition-attribute related operations."""

    @staticmethod
    def upsert_condition_attribute(condition_id, attributes):

        for attribute in attributes:
            condition_attribute_id = attribute.get("id")
            attribute_key_name = attribute.get("key")

            attribute_key_entry = db.session.query(AttributeKey).filter_by(key_name=attribute_key_name).first()
            if not attribute_key_entry:
                raise AttributeKeyNotFoundError(attribute_key_name)

            attribute_key_id = attribute_key_entry.id

            # Check if the condition attribute exists
            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id, attribute_key_id=attribute_key_id
            ).first()

            if not existing_attribute:
                if "-" in str(condition_attribute_id):
                    existing_attribute = False
                else:
                    existing_attribute = db.session.query(ConditionAttribute).filter_by(
                        id=condition_attribute_id
                    ).first()

            if existing_attribute:
                # Update the existing condition attribute
                existing_attribute.attribute_value = attribute.get("value")
            else:
                # Insert a new condition attribute
                new_condition_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=attribute_key_id,
                    attribute_value=attribute.get("value")
                )
                db.session.add(new_condition_attribute)
                db.session.flush()

        db.session.commit()
        return attributes
