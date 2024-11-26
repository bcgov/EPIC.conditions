"""Service for project management."""
from sqlalchemy.orm import aliased
from condition_api.models.db import db
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition_attribute import ConditionAttribute


class AttributeKeyService:
    """Attribute Key management service."""

    @staticmethod
    def get_all_attributes(condition_id):
        """Fetch all attributes."""

        condition_attributes = aliased(ConditionAttribute)
        attribute_keys = aliased(AttributeKey)

        subquery = (
            db.session.query(condition_attributes.attribute_key_id)
            .filter(condition_attributes.condition_id == condition_id)
            .subquery()
        )

        attributes_data = (
            db.session.query(
                attribute_keys.id,
                attribute_keys.key_name,
            )
            .filter(
                ~attribute_keys.id.in_(db.session.query(subquery.c.attribute_key_id)),
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
