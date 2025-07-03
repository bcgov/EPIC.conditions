"""Condition model class.

Manages the condition
"""

from condition_api.schemas.condition_attribute import ConditionAttributesSchema
from condition_api.schemas.subcondition import SubconditionSchema

from marshmallow import Schema, fields


class ConditionSchema(Schema):
    """Condition schema."""

    condition_id = fields.Str(data_key="condition_id")
    condition_name = fields.Str(data_key="condition_name", allow_none=True)
    condition_number = fields.Int(data_key="condition_number", allow_none=True)
    condition_text = fields.Str(data_key="condition_text", allow_none=True)
    topic_tags = fields.List(fields.Str(), data_key="topic_tags", allow_none=True)
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags", allow_none=True)
    amendment_names = fields.Str(data_key="amendment_names", allow_none=True)
    year_issued = fields.Int(data_key="year_issued", allow_none=True)
    is_approved = fields.Bool(data_key="is_approved", allow_none=True)
    is_topic_tags_approved = fields.Bool(data_key="is_topic_tags_approved", allow_none=True)
    is_condition_attributes_approved = fields.Bool(
        data_key="is_condition_attributes_approved", allow_none=True)
    requires_management_plan = fields.Bool(
        data_key="requires_management_plan", allow_none=True)
    condition_attributes = fields.Nested(ConditionAttributesSchema, data_key="condition_attributes")
    effective_document_id = fields.Str(data_key="effective_document_id", allow_none=True)
    is_standard_condition = fields.Bool(data_key="is_standard_condition", allow_none=True)
    source_document = fields.Str(data_key="source_document", allow_none=True)
    # Condition can also have its own subconditions (recursive nesting)
    subconditions = fields.List(fields.Nested(SubconditionSchema), data_key="subconditions")


class ProjectDocumentConditionSchema(Schema):
    """Top-level schema to include project and document names."""

    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")


class ProjectDocumentConditionDetailSchema(Schema):
    """Top-level schema to include project and document names."""

    project_id = fields.Str(data_key="project_id")
    project_name = fields.Str(data_key="project_name")
    document_category_id = fields.Str(data_key="document_category_id")
    document_category = fields.Str(data_key="document_category")
    document_label = fields.Str(data_key="document_label")
    document_id = fields.Str(data_key="document_id")
    condition = fields.Nested(ConditionSchema, data_key="condition")


class ConsolidatedConditionSchema(Schema):
    """Condition schema."""

    condition_name = fields.Str(data_key="condition_name", allow_none=True)
    condition_number = fields.Int(data_key="condition_number", allow_none=True)
    condition_text = fields.Str(data_key="condition_text", allow_none=True)
    topic_tags = fields.List(fields.Str(), data_key="topic_tags", allow_none=True)
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags", allow_none=True)
    amendment_names = fields.Str(data_key="amendment_names", allow_none=True)
    year_issued = fields.Int(data_key="year_issued", allow_none=True)
    condition_attributes = fields.Dict(data_key="condition_attributes", allow_none=True)

    # Condition can also have its own subconditions (recursive nesting)
    subconditions = fields.List(fields.Nested(SubconditionSchema), data_key="subconditions")
