"""Service for project management."""
from sqlalchemy.orm import aliased
from condition_api.models.db import db
from condition_api.models.attribute_key import AttributeKey


class AttributeKeyService:
    """Attribute Key management service."""

    @staticmethod
    def get_all_attributes():
        """Fetch all attributes."""

        attribute_keys = aliased(AttributeKey)

        attributes_data = (
            db.session.query(
                attribute_keys.id,
                attribute_keys.key_name,
            )
            .filter(
                ~attribute_keys.id.in_([2, 4])
            )
            .all()
        )

        if not attributes_data:
            return None

        result = []

        for attributes in attributes_data:
            result.append({
                "attribute_key_id": attributes.id,
                "attribute_key_name": attributes.key_name
            })

        return result
