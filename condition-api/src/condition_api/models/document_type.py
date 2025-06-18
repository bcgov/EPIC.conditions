"""Document Type model class.

Manages the Document Type
"""
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.ext.declarative import declarative_base

from .base_model import BaseModel

Base = declarative_base()


class DocumentType(BaseModel):
    """Definition of the Document Type entity."""

    __tablename__ = 'document_types'

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_category_id = Column(Integer,
                                  ForeignKey('condition.document_categories.id',
                                             ondelete='CASCADE'), nullable=True)
    document_type = Column(String(255), nullable=False)

    __table_args__ = (
        {'schema': 'condition'}
    )

    @classmethod
    def get_all(cls):
        """Get all document types."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, document_id):
        """Get document by document_id."""
        return cls.query.filter_by(id=document_id).first()
