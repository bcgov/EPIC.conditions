"""Condition Attribute model class.

Manages the Condition Attribute
"""
from sqlalchemy import Column, Integer, Text, String, Boolean, ARRAY, ForeignKey
from .base_model import BaseModel

class ConditionAttribute(BaseModel):
    """Definition of the Condition Attribute entity."""
    __tablename__ = 'condition_attributes'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    attribute_key = Column(Text, nullable=False)
    attribute_value = Column(Text, nullable=True)

    @classmethod
    def get_all(cls):
        """Get all condition attributes."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, condition_attributes_id):
        """Get condition attributes by ID."""
        return cls.query.filter_by(id=condition_attributes_id).first()
