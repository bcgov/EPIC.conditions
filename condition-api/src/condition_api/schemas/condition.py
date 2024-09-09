"""Condition model class.

Manages the condition
"""

from marshmallow import Schema, fields

class DeliverableSchema(Schema):
    """Deliverable schema."""

    deliverable_name = fields.Str(data_key="deliverable_name")
    is_plan = fields.Bool(data_key="is_plan")
    approval_type = fields.Str(data_key="approval_type")
    stakeholders_to_consult = fields.List(fields.Str(), data_key="stakeholders_to_consult")
    stakeholders_to_submit_to = fields.List(fields.Str(), data_key="stakeholders_to_submit_to")
    fn_consultation_required = fields.Bool(data_key="fn_consultation_required")
    related_phase = fields.Str(data_key="related_phase")
    days_prior_to_commencement = fields.Int(data_key="days_prior_to_commencement")

class ConditionSchema(Schema):
    """Condition schema."""

    condition_name = fields.Str(data_key="condition_name")
    condition_number = fields.Int(data_key="condition_number")
    condition_text = fields.Str(data_key="condition_text")
    topic_tags = fields.List(fields.Str(), data_key="topic_tags")
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags")
    is_approved = fields.Bool(data_key="is_approved")
    deliverable_name = fields.Str(data_key="deliverable_name")
    deliverables = fields.List(fields.Nested(DeliverableSchema), data_key="deliverables")
