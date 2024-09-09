"""Project model class.

Manages the project
"""

from marshmallow import EXCLUDE, Schema, fields

class ConditionSchema(Schema):
    """Condition schema."""

    condition_name = fields.Str(data_key="condition_name")
    condition_number = fields.Int(data_key="condition_number")
    condition_text = fields.Str(data_key="condition_text")
    topic_tags = fields.List(fields.Str(), data_key="topic_tags")
    subtopic_tags = fields.List(fields.Str(), data_key="subtopic_tags")

class ProjectSchema(Schema):
    """Project schema, including conditions and deliverables."""

    class Meta:
        """Exclude unknown fields in the deserialized output."""
        unknown = EXCLUDE

    project_id = fields.Str(data_key="project_id")
    project_name = fields.Str(data_key="project_name")
    document_id = fields.Str(data_key="document_id")
    display_name = fields.Str(data_key="display_name")
    document_file_name = fields.Str(data_key="document_file_name")
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")
