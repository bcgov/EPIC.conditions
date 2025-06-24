"""Subconditio model class.

Manages the Subconditio
"""

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        """Meta"""

        unknown = EXCLUDE


class SubconditionSchema(BaseSchema):
    """Subcondition schema."""

    subcondition_id = fields.Str(data_key="subcondition_id")
    subcondition_identifier = fields.Str(data_key="subcondition_identifier")
    subcondition_text = fields.Str(data_key="subcondition_text")
    sort_order = fields.Int(data_key="sort_order")

    # Recursively define subconditions (i.e., subconditions can have child subconditions)
    subconditions = fields.List(fields.Nested(lambda: SubconditionSchema()), data_key="subconditions")
