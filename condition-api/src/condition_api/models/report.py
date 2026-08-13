"""Report model class."""
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base_model import BaseModel
from .db import db


class Report(BaseModel):
    """Definition of the Report entity."""

    __tablename__ = 'reports'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    report_type = Column(String, nullable=False)
    name = Column(Text, nullable=True)

    submissions = relationship('ReportSubmission', back_populates='report', cascade='all, delete-orphan')

    @classmethod
    def get_by_condition_id(cls, condition_id):
        """Get reports by condition ID."""
        return cls.query.filter_by(condition_id=condition_id).all()

    @classmethod
    def delete_by_id(cls, report_id):
        """Delete a report by its ID."""
        report = cls.query.filter_by(id=report_id).one_or_none()
        if report:
            db.session.delete(report)
            db.session.commit()
            return True
        return False
