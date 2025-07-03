"""Condition Attribute model class.

Manages the Condition Attribute
"""

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        """Meta"""

        unknown = EXCLUDE


class ConditionAttributeSchema(BaseSchema):
    """Condition Attribute schema."""

    deliverable_name = fields.Str(data_key="deliverable_name")
    requires_management_plan = fields.Bool(data_key="requires_management_plan")
    submitted_to_eao_for = fields.Str(data_key="submitted_to_eao_for")
    milestones_related_to_plan_submission = fields.Str(
        data_key="milestones_related_to_plan_submission")
    milestones_related_to_plan_implementation = fields.List(
        fields.Str(), data_key="milestones_related_to_plan_implementation")
    time_associated_with_submission_milestone = fields.List(
        fields.Str(), data_key="time_associated_with_submission_milestone")
    management_plan_acronym = fields.Bool(data_key="management_plan_acronym")
    parties_required_to_be_consulted = fields.List(fields.Str(),
                                                   data_key="parties_required_to_be_consulted")
    parties_required_to_be_submitted = fields.List(fields.Str(),
                                                   data_key="parties_required_to_be_submitted")
    requires_consultation = fields.Bool(data_key="requires_consultation")
    requires_iem_terms_of_engagement = fields.Bool(data_key="requires_iem_terms_of_engagement")


class ConditionAttributeDetailsSchema(Schema):
    """Independent Condition Attribute schema."""

    id = fields.Str(data_key="id", allow_none=True)
    key = fields.Str(data_key="key", allow_none=True)
    value = fields.Str(data_key="value", allow_none=True)


class ManagementPlanWithAttributesSchema(Schema):
    """Management Plan Condition Attribute schema."""

    id = fields.Str(data_key="id", required=True)
    name = fields.Str(data_key="name", required=True)
    is_approved = fields.Bool(data_key="is_approved", required=False)
    attributes = fields.List(fields.Nested(ConditionAttributeDetailsSchema))


class ConditionAttributesSchema(Schema):
    """Condition Attribute schema."""

    independent_attributes = fields.List(fields.Nested(ConditionAttributeDetailsSchema))
    management_plans = fields.List(fields.Nested(ManagementPlanWithAttributesSchema))
