"""Project model class.

Manages the project
"""

from marshmallow import EXCLUDE, Schema, fields

class SubconditionSchema(Schema):
    """Subcondition schema."""
    subcondition_id = fields.Str(data_key="subcondition_id")
    subcondition_identifier = fields.Str(data_key="subcondition_identifier")
    subcondition_text = fields.Str(data_key="subcondition_text")
    
    # Recursively define subconditions (i.e., subconditions can have child subconditions)
    subconditions = fields.List(fields.Nested(lambda: SubconditionSchema()), data_key="subconditions")

class DeliverableSchema(Schema):
    """Deliverable schema."""
    deliverable_name = fields.Str(data_key="deliverable_name")
    is_plan = fields.Bool(data_key="is_plan")
    approval_type = fields.Str(data_key="approval_type")
    stakeholders_to_consult = fields.List(fields.Str(), data_key="stakeholders_to_consult")
    stakeholders_to_submit_to = fields.List(fields.Str(), data_key="stakeholders_to_submit_to")
    consultation_required = fields.Bool(data_key="consultation_required")
    related_phase = fields.Str(data_key="related_phase")
    days_prior_to_commencement = fields.Int(data_key="days_prior_to_commencement")


class ConditionSchema(Schema):
    """Condition schema."""
    condition_name = fields.Str(data_key="condition_name")
    condition_number = fields.Int(data_key="condition_number")
    condition_text = fields.Str(data_key="condition_text")
    topic_tags = fields.List(fields.Str(), data_key="topic_tags")
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags")

    # Add subconditions and deliverables to the condition
    subconditions = fields.List(fields.Nested(SubconditionSchema), data_key="subconditions")
    deliverables = fields.List(fields.Nested(DeliverableSchema), data_key="deliverables")


class DocumentSchema(Schema):
    """Document schema."""
    document_id = fields.Str(data_key="document_id")
    display_name = fields.Str(data_key="display_name")
    document_file_name = fields.Str(data_key="document_file_name")
    
    # Each document can have multiple conditions
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")


class ProjectSchema(Schema):
    """Project schema, including documents, conditions, subconditions, and deliverables."""

    class Meta:
        """Exclude unknown fields in the deserialized output."""
        unknown = EXCLUDE

    project_id = fields.Str(data_key="project_id")
    project_name = fields.Str(data_key="project_name")
    
    # A project can have multiple documents
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")
