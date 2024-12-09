"""Condition Attribute model class.

Manages the Condition Attribute
"""

from marshmallow import EXCLUDE, Schema, fields

class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        unknown = EXCLUDE


class ConditionAttributeSchema(BaseSchema):
    """Condition Attribute schema."""
    deliverable_name = fields.Str(data_key="deliverable_name")
    is_plan = fields.Bool(data_key="is_plan")
    approval_type = fields.Str(data_key="approval_type")
    stakeholders_to_consult = fields.List(fields.Str(), data_key="stakeholders_to_consult")
    stakeholders_to_submit_to = fields.List(fields.Str(), data_key="stakeholders_to_submit_to")
    consultation_required = fields.Bool(data_key="consultation_required")
    related_phase = fields.Str(data_key="related_phase")
    days_prior_to_commencement = fields.Int(data_key="days_prior_to_commencement")

class UpdateConditionAttributeSchema(BaseSchema):
    """Condition Attribute schema."""
    id = fields.Str(data_key="id")
    key = fields.Str(data_key="key")
    value = fields.Str(data_key="value")
