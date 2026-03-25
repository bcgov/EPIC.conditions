"""Document Category model class.

Manages the document category
"""

from condition_api.schemas.document import DocumentSchema

from marshmallow import Schema, fields


class DocumentCategorySchema(Schema):
    """Top-level schema to include all amendments related to a document."""

    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")


class DocumentCategoryListSchema(Schema):
    """Schema for a single document category list item."""

    id = fields.Int(data_key="id")
    category_name = fields.Str(data_key="category_name")
