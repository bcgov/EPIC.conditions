"""Staff user schema class.

Manages the staff user schema
"""

from marshmallow import EXCLUDE, Schema, fields


class StaffUserSchema(Schema):
    """Staff user schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key="id")
    first_name = fields.Str(data_key="first_name")
    last_name = fields.Str(data_key="last_name")
    full_name = fields.Str(data_key="full_name")
    position = fields.Str(data_key="position")
    work_email_address = fields.Str(data_key="work_email_address")
    work_contact_number = fields.Str(data_key="work_contact_number")
    auth_guid = fields.Str(data_key="auth_guid")
