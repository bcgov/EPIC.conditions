"""Management plan model class.

Manages the Management plan
"""

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        """Meta"""

        unknown = EXCLUDE


class ManagementPlanSchema(BaseSchema):
    """Management plan schema."""

    id = fields.Str(data_key="id")
    condition_id = fields.Str(data_key="condition_id")
    name = fields.Str(data_key="name")
    is_approved = fields.Bool(data_key="is_approved")
