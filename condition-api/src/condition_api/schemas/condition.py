"""Condition model class.

Manages the condition
"""

from marshmallow import Schema, fields
from condition_api.schemas.condition_attribute import UpdateConditionAttributeSchema
from condition_api.schemas.subcondition import SubconditionSchema

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
    condition_attributes = fields.List(fields.Nested(UpdateConditionAttributeSchema), data_key="condition_attributes")
    
    # Condition can also have its own subconditions (recursive nesting)
    subconditions = fields.List(fields.Nested(SubconditionSchema), data_key="subconditions")

class ProjectDocumentConditionSchema(Schema):
    """Top-level schema to include project and document names."""
    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    document_category_id = fields.Str(data_key="document_category_id")
    document_label = fields.Str(data_key="document_label")
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")

class ProjectDocumentConditionDetailSchema(Schema):
    """Top-level schema to include project and document names."""
    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    document_label = fields.Str(data_key="document_label")
    condition = fields.Nested(ConditionSchema, data_key="condition")
