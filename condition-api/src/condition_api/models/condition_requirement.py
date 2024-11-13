"""Condition Requirement model class.

Manages the Condition Requirement
"""
from sqlalchemy import Column, Integer, Text, String, Boolean, ARRAY, ForeignKey
from .base_model import BaseModel

class ConditionRequirement(BaseModel):
    """Definition of the Condition Requirement entity."""
    __tablename__ = 'condition_requirements'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    document_id = Column(String, ForeignKey('condition.documents.document_id', ondelete='CASCADE'), nullable=False)
    deliverable_name = Column(Text)
    is_plan = Column(Boolean)
    approval_type = Column(Text)
    stakeholders_to_consult = Column(ARRAY(Text))
    stakeholders_to_submit_to = Column(ARRAY(Text))
    consultation_required = Column(Boolean)
    related_phase = Column(Text)
    days_prior_to_commencement = Column(Integer)
    is_approved = Column(Boolean, nullable=True)

    @classmethod
    def get_all(cls):
        """Get all condition attributes."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, condition_requirements_id):
        """Get condition requirements by ID."""
        return cls.query.filter_by(id=condition_requirements_id).first()
