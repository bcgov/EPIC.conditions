"""Attribute key model class.

Manages the attribute key
"""

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        """Meta"""

        unknown = EXCLUDE


class AttributeKeySchema(BaseSchema):
    """Attribute key schema."""

    attribute_key_id = fields.Str(data_key="id")
    attribute_key_name = fields.Str(data_key="key_name")
