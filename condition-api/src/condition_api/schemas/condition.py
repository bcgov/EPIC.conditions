"""Condition model class.

Manages the condition
"""

from marshmallow import Schema, fields

class ConditionAttributeSchema(Schema):
    id = fields.Str(required=True, data_key="id")
    key = fields.Str(required=True, data_key="key")
    value = fields.Raw(allow_none=True, data_key="value")

class SubConditionSchema(Schema):
    """Recursive schema for subconditions."""
    subcondition_id = fields.Str(data_key="subcondition_id")
    subcondition_identifier = fields.Str(data_key="subcondition_identifier")
    subcondition_text = fields.Str(data_key="subcondition_text")
    
    # Recursively define subconditions (i.e., subconditions can have child subconditions)
    subconditions = fields.List(fields.Nested(lambda: SubConditionSchema()), data_key="subconditions")

class ConditionSchema(Schema):
    """Condition schema."""

    condition_id = fields.Str(data_key="condition_id")
    condition_name = fields.Str(data_key="condition_name")
    condition_number = fields.Int(data_key="condition_number")
    condition_text = fields.Str(data_key="condition_text")
    topic_tags = fields.List(fields.Str(), data_key="topic_tags")
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags")
    amendment_names = fields.Str(data_key="amendment_names")
    year_issued = fields.Int(data_key="year_issued")
    is_approved = fields.Bool(data_key="is_approved")
    is_topic_tags_approved = fields.Bool(data_key="is_topic_tags_approved", allow_none=True)
    is_condition_attributes_approved = fields.Bool(data_key="is_condition_attributes_approved", allow_none=True)
    deliverable_name = fields.Str(data_key="deliverable_name")
    condition_attributes = fields.List(fields.Nested(ConditionAttributeSchema), data_key="condition_attributes")
    
    # Condition can also have its own subconditions (recursive nesting)
    subconditions = fields.List(fields.Nested(SubConditionSchema), data_key="subconditions")

class ProjectDocumentConditionSchema(Schema):
    """Top-level schema to include project and document names."""
    project_name = fields.Str(data_key="project_name")
    document_type = fields.Str(data_key="document_type")
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")

class ProjectDocumentConditionDetailSchema(Schema):
    """Top-level schema to include project and document names."""
    project_name = fields.Str(data_key="project_name")
    document_type = fields.Str(data_key="document_type")
    display_name = fields.Str(data_key="display_name")
    condition = fields.Nested(ConditionSchema, data_key="condition")
