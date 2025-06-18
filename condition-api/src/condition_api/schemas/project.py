"""Project model class.

Manages the project
"""

from condition_api.schemas.document import DocumentSchema

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields in the deserialized output."""

    class Meta:
        """Meta"""

        unknown = EXCLUDE


class ProjectSchema(BaseSchema):
    """Project schema, including documents, conditions, subconditions, and management plans."""

    project_id = fields.Str(data_key="project_id")
    project_name = fields.Str(data_key="project_name")

    # A project can have multiple documents
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")
