"""Condition Attribute model class.

Manages the Condition Attribute
"""
from sqlalchemy import Column, Integer, Text, ForeignKey
from .base_model import BaseModel

class ConditionAttribute(BaseModel):
    """Definition of the Condition Attribute entity."""
    __tablename__ = 'condition_attributes'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    attribute_key_id = Column(Integer, ForeignKey('condition.attribute_keys.id', ondelete='CASCADE'), nullable=False)
    attribute_value = Column(Text, nullable=True)

    @classmethod
    def get_all(cls):
        """Get all condition attributes."""
        return cls.query.all()

    @classmethod
    def get_by_condition_id(cls, condition_id):
        """Get condition attributes by condition ID."""
        return cls.query.filter_by(condition_id=condition_id).all()
