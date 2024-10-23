"""Project model class.

Manages the project
"""

from marshmallow import EXCLUDE, Schema, fields

class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        unknown = EXCLUDE


class SubconditionSchema(BaseSchema):
    """Subcondition schema."""
    subcondition_id = fields.Str(data_key="subcondition_id")
    subcondition_identifier = fields.Str(data_key="subcondition_identifier")
    subcondition_text = fields.Str(data_key="subcondition_text")
    
    # Recursively define subconditions (i.e., subconditions can have child subconditions)
    subconditions = fields.List(fields.Nested(lambda: SubconditionSchema()), data_key="subconditions")

class ConditionRequirementSchema(BaseSchema):
    """Condition Requirement schema."""
    deliverable_name = fields.Str(data_key="deliverable_name")
    is_plan = fields.Bool(data_key="is_plan")
    approval_type = fields.Str(data_key="approval_type")
    stakeholders_to_consult = fields.List(fields.Str(), data_key="stakeholders_to_consult")
    stakeholders_to_submit_to = fields.List(fields.Str(), data_key="stakeholders_to_submit_to")
    consultation_required = fields.Bool(data_key="consultation_required")
    related_phase = fields.Str(data_key="related_phase")
    days_prior_to_commencement = fields.Int(data_key="days_prior_to_commencement")


class ConditionSchema(BaseSchema):
    """Condition schema."""
    condition_name = fields.Str(data_key="condition_name")
    condition_number = fields.Int(data_key="condition_number")
    condition_text = fields.Str(data_key="condition_text")
    topic_tags = fields.List(fields.Str(), data_key="topic_tags")
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags")

    # Add subconditions and condition requirements to the condition
    subconditions = fields.List(fields.Nested(SubconditionSchema), data_key="subconditions")
    condition_requirements = fields.List(fields.Nested(ConditionRequirementSchema), data_key="condition_requirements")


class DocumentSchema(BaseSchema):
    """Document schema."""
    document_id = fields.Str(data_key="document_id")
    display_name = fields.Str(data_key="display_name")
    document_file_name = fields.Str(data_key="document_file_name")
    document_type = fields.Str(data_key="document_type")
    date_issued = fields.Str(data_key="date_issued")
    act = fields.Int(data_key="act")
    project_id = fields.Str(data_key="project_id")
    first_nations = fields.List(fields.Str(), data_key="first_nations")
    consultation_records_required = fields.Bool(data_key="consultation_records_required")
    status = fields.Bool(data_key="status")
    
    # Each document can have multiple conditions
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")


class ProjectSchema(BaseSchema):
    """Project schema, including documents, conditions, subconditions, and deliverables."""

    project_id = fields.Str(data_key="project_id")
    project_name = fields.Str(data_key="project_name")
    project_type = fields.Str(data_key="project_type")
    
    # A project can have multiple documents
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")


class AllProjectsSchema(BaseSchema):
    """Schema for returning a list of all projects."""
    projects = fields.List(fields.Nested(ProjectSchema))  # Reuse the ProjectSchema
