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
    document_type = Column(String(100), nullable=False)
    amendment_name = Column(Text)
    date_issued = Column(Date)
    act = Column(Integer)

    # Establish the relationship back to the Project table
    document = relationship('Document', foreign_keys=[document_id])

    __table_args__ = (
        UniqueConstraint('amended_document_id', name='uq_amended_document'),
        {'schema': 'condition'},
    )

    @classmethod
    def get_all(cls):
        """Get all amended documents."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, document_id):
        """Get amended document by document_id."""
        return cls.query.filter_by(document_id=document_id).first()