from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base_model import BaseModel

class Subcondition(BaseModel):
    """Definition of the Subconditions entity."""
    __tablename__ = 'subconditions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'))
    amended_document_id = Column(String, ForeignKey('condition.amendments.amended_document_id', ondelete='CASCADE'), nullable=True)
    subcondition_identifier = Column(String, nullable=True)
    subcondition_text = Column(Text, nullable=True)
    parent_subcondition_id = Column(Integer, ForeignKey('condition.subconditions.id', ondelete='CASCADE'), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Self-referencing relationship to allow subconditions to have sub subconditions
    subsubconditions = relationship('Subcondition', backref='parent', remote_side=[id])

    # Establish the relationship back to the condition
    condition = relationship('Condition', back_populates='subconditions')

    __table_args__ = (
        {'schema': 'condition'}
    )
