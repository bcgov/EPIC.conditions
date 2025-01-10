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
    requires_management_plan = fields.Bool(data_key="requires_management_plan")
    submitted_to_eao_for = fields.Str(data_key="submitted_to_eao_for")
    milestone_related_to_plan_submission = fields.Str(data_key="milestone_related_to_plan_submission")
    milestones_related_to_plan_implementation = fields.List(fields.Str(), data_key="milestones_related_to_plan_implementation")
    time_associated_with_submission_milestone = fields.List(fields.Str(), data_key="time_associated_with_submission_milestone")
    management_plan_acronym = fields.Bool(data_key="management_plan_acronym")
    parties_required_to_be_consulted = fields.List(fields.Str(), data_key="parties_required_to_be_consulted")
    parties_required_to_be_submitted = fields.List(fields.Str(), data_key="parties_required_to_be_submitted")
    requires_consultation = fields.Bool(data_key="requires_consultation")

class UpdateConditionAttributeSchema(BaseSchema):
    """Condition Attribute schema."""
    id = fields.Str(data_key="id")
    key = fields.Str(data_key="key")
    value = fields.Str(data_key="value")
