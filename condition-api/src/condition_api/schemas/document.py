"""Document model class.

Manages the document
"""

from marshmallow import Schema, fields

class DocumentSchema(Schema):
    """Documents schema."""

    document_id = fields.Str(data_key="document_id")
    document_name = fields.Str(data_key="document_name")
    year_issued = fields.Int(data_key="year_issued")
    status = fields.Bool(data_key="status")

class ProjectDocumentAllAmendmentsSchema(Schema):
    """Top-level schema to include all amendments related to a document."""
    project_name = fields.Str(data_key="project_name")
    document_type = fields.Str(data_key="document_type")
    amendments = fields.List(fields.Nested(DocumentSchema), data_key="amendments")
