"""Amendment model class.

Manages the amendment
"""
from sqlalchemy import Column, Integer, String, Text, Date, Boolean, ARRAY, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.schema import UniqueConstraint
from .base_model import BaseModel

Base = declarative_base()

class Amendment(BaseModel):
    """Definition of the Amendments entity."""
    __tablename__ = 'amendments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey('condition.documents.id', ondelete='CASCADE'), nullable=False)
    amended_document_id = Column(String(255), nullable=False)
    document_type_id = Column(Integer, ForeignKey('condition.document_types.id', ondelete='CASCADE'), nullable=True)
    amendment_name = Column(Text)
    amendment_link = Column(Text)
    date_issued = Column(Date)
    act = Column(Integer)

    # Establish the relationship back to the Project table
    document = relationship('Document', foreign_keys=[document_id])

    __table_args__ = (
        UniqueConstraint('amended_document_id', name='uq_amended_document'),
        {'schema': 'condition'},
    )
