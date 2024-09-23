"""Deliverables model class.

Manages the Deliverables
"""
from sqlalchemy import Column, Integer, Text, Boolean, ARRAY, ForeignKey
from .base_model import BaseModel

class Deliverable(BaseModel):
    """Definition of the Deliverables entity."""
    __tablename__ = 'deliverables'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    deliverable_name = Column(Text)
    is_plan = Column(Boolean)
    approval_type = Column(Text)
    stakeholders_to_consult = Column(ARRAY(Text))
    stakeholders_to_submit_to = Column(ARRAY(Text))
    consultation_required = Column(Boolean)
    related_phase = Column(Text)
    days_prior_to_commencement = Column(Integer)

    @classmethod
    def get_all(cls):
        """Get all deliverables."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, deliverable_id):
        """Get deliverable by ID."""
        return cls.query.filter_by(id=deliverable_id).first()
