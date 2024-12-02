"""Document model class.

Manages the document
"""

from marshmallow import Schema, fields

class DocumentTypeSchema(Schema):
    """Documents type schema."""

    id = fields.Int(data_key="id")
    document_category_id = fields.Int(data_key="document_category_id")
    document_type = fields.Str(data_key="document_type")

class DocumentSchema(Schema):
    """Documents schema."""

    document_id = fields.Str(data_key="document_id")
    document_name = fields.Str(data_key="document_name")
    year_issued = fields.Int(data_key="year_issued")
    status = fields.Bool(data_key="status")

class ProjectDocumentAllAmendmentsSchema(Schema):
    """Top-level schema to include all amendments related to a document."""
    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")
