"""Service for condition attribute management."""
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.db import db

class ConditionAttributeService:
    """Service for managing condition-attribute related operations."""

    @staticmethod
    def upsert_condition_attribute(condition_id, attributes):

        for attribute in attributes:
            condition_attribute_id = attribute.get("id")
            attribute_key_name = attribute.get("key")

            attribute_key_entry = db.session.query(AttributeKey).filter_by(key_name=attribute_key_name).first()
            if not attribute_key_entry:
                attribute_key_entry = AttributeKey(key_name=attribute_key_name)
                db.session.add(attribute_key_entry)
                db.session.flush()

            attribute_key_id = attribute_key_entry.id

            # Check if the condition attribute exists
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
