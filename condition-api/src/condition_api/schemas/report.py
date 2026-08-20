"""Report and ReportSubmission schemas."""

from marshmallow import EXCLUDE, Schema, fields


class BaseSchema(Schema):
    """Base schema to exclude unknown fields."""

    class Meta:
        """Meta options."""

        unknown = EXCLUDE


class ReportSubmissionSchema(BaseSchema):
    """Schema for a single report submission (one phase)."""

    id = fields.Int()
    report_id = fields.Int()
    phase = fields.Str()
    frequency = fields.Str(allow_none=True)
    timing = fields.Str(allow_none=True)
    condition_subsection = fields.Str(allow_none=True)
    report_submission_type = fields.Str(allow_none=True)
    is_approved = fields.Bool()
    linked_management_plan_id = fields.Int(allow_none=True)
    report_title = fields.Str(allow_none=True)


class ReportSchema(BaseSchema):
    """Schema for a report with its submissions."""

    id = fields.Int()
    condition_id = fields.Int()
    report_type = fields.Str()
    name = fields.Str(allow_none=True)
    submissions = fields.List(fields.Nested(ReportSubmissionSchema))
