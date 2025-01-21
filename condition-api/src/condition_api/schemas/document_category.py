"""Document Category model class.

Manages the document category
"""

from marshmallow import Schema, fields
from condition_api.schemas.document import DocumentSchema

class DocumentCategorySchema(Schema):
    """Top-level schema to include all amendments related to a document."""
    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")
