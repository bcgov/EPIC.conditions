"""Condition Attribute Value model class.

Manages the Attribute Value
"""
from sqlalchemy import Column, Integer, Text
from .base_model import BaseModel

class AttributeKey(BaseModel):
    """Definition of the Attribute Key entity."""
    __tablename__ = 'attribute_keys'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    key_name = Column(Text, nullable=False, unique=True)

    @classmethod
    def get_all(cls):
        """Get all attribute keys."""
        return cls.query.all()
