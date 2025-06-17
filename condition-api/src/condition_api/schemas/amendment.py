"""Amendment model class.

Manages the amendment
"""

from marshmallow import Schema, fields


class AmendmentSchema(Schema):
    """Amendment schema."""

    document_id = fields.Str(data_key="document_id")
    amended_document_id = fields.Str(data_key="amended_document_id")
    amendment_name = fields.Str(data_key="amendment_name")
    amendment_link = fields.Str(data_key="amendment_link")
    document_type_id = fields.Int(data_key="document_type_id")
    date_issued = fields.Str(data_key="date_issued")
    act = fields.Int(data_key="act")
    is_latest_amendment_added = fields.Bool(data_key="is_latest_amendment_added")
