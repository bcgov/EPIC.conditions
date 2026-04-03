"""Extraction Request model class.

Tracks documents uploaded via the UI pending cron-based extraction.
"""
from sqlalchemy import Column, ForeignKey, Integer, String, Text

from .base_model import BaseModel


class ExtractionRequest(BaseModel):
    """Definition of the Extraction Request entity."""

    __tablename__ = 'extraction_requests'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(255), ForeignKey('condition.projects.project_id'), nullable=False)
    document_id = Column(String(255), nullable=True)
    document_type_id = Column(Integer, ForeignKey('condition.document_types.id'), nullable=True)
    document_label = Column(Text, nullable=True)
    s3_url = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default='pending')
    error_message = Column(Text, nullable=True)

    __table_args__ = ({'schema': 'condition'},)

    @classmethod
    def get_pending(cls):
        """Get all pending extraction requests."""
        return cls.query.filter_by(status='pending').all()
