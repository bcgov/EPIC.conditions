"""Report Submission model class."""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class ReportSubmission(BaseModel):
    """Definition of the Report Submission entity. One row = one phase."""

    __tablename__ = 'report_submissions'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey('condition.reports.id', ondelete='CASCADE'), nullable=False)
    phase = Column(String, nullable=False)
    frequency = Column(String, nullable=True)
    timing = Column(Text, nullable=True)
    condition_subsection = Column(Text, nullable=True)
    report_submission_type = Column(String, nullable=True)
    is_approved = Column(Boolean, nullable=True, server_default=text('false'))

    report = relationship('Report', back_populates='submissions')

    @classmethod
    def get_by_report_id(cls, report_id):
        """Get submissions by report ID."""
        return cls.query.filter_by(report_id=report_id).all()

    @classmethod
    def delete_by_id(cls, submission_id):
        """Delete a submission by its ID."""
        submission = cls.query.filter_by(id=submission_id).one_or_none()
        if submission:
            db.session.delete(submission)
            db.session.commit()
            return True
        return False
