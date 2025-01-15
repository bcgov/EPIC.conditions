"""Document model class.

Manages the document
"""

from marshmallow import Schema, fields
from condition_api.schemas.condition import ConditionSchema

class DocumentTypeSchema(Schema):
    """Documents type schema."""

    id = fields.Int(data_key="id")
    document_category_id = fields.Int(data_key="document_category_id")
    document_type = fields.Str(data_key="document_type")

class DocumentSchema(Schema):
    """Documents schema."""

    document_record_id = fields.Str(data_key="document_record_id")
    document_id = fields.Str(data_key="document_id")
    document_label = fields.Str(data_key="document_label")
    document_link = fields.Str(data_key="document_link")
    document_file_name = fields.Str(data_key="document_file_name")
    document_category_id = fields.Str(data_key="document_category_id")
    document_category = fields.Str(data_key="document_category")
    document_types = fields.List(fields.Str(), data_key="document_types")
    document_type_id = fields.Int(data_key="document_type_id")
    date_issued = fields.Str(data_key="date_issued")
    year_issued = fields.Int(data_key="year_issued")
    act = fields.Int(data_key="act")
    project_id = fields.Str(data_key="project_id")
    first_nations = fields.List(fields.Str(), data_key="first_nations")
    consultation_records_required = fields.Bool(data_key="consultation_records_required")
    status = fields.Bool(data_key="status")
    amendment_count = fields.Int(data_key="amendment_count")
    is_latest_amendment_added = fields.Bool(data_key="is_latest_amendment_added")
    
    # Each document can have multiple conditions
    conditions = fields.List(fields.Nested(ConditionSchema), data_key="conditions")

class ProjectDocumentAllAmendmentsSchema(Schema):
    """Top-level schema to include all amendments related to a document."""
    project_name = fields.Str(data_key="project_name")
    document_category = fields.Str(data_key="document_category")
    documents = fields.List(fields.Nested(DocumentSchema), data_key="documents")

class DocumentDetailsSchema(Schema):
    """Top-level schema to include all amendments related to a document."""
    project_name = fields.Str(data_key="project_name")
    document_category_id = fields.Str(data_key="document_category_id")
    document_category = fields.Str(data_key="document_category")
    document_id = fields.Str(data_key="document_id")
    document_label = fields.Str(data_key="document_label")
