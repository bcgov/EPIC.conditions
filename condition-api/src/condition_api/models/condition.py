"""Condition model class.

Manages the Condition
"""
from sqlalchemy import ARRAY, Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from condition_api.utils.enums import ConditionType

from .base_model import BaseModel


class Condition(BaseModel):
    """Definition of the Conditions entity."""

    __tablename__ = 'conditions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey('condition.projects.project_id', ondelete='CASCADE'), nullable=False)
    document_id = Column(String, ForeignKey('condition.documents.document_id', ondelete='CASCADE'), nullable=False)
    amended_document_id = Column(String,
                                 ForeignKey('condition.amendments.amended_document_id',
                                            ondelete='CASCADE'), nullable=True)
    condition_name = Column(Text, nullable=True)
    condition_number = Column(Integer, nullable=True)
    condition_text = Column(Text, nullable=True)
    topic_tags = Column(ARRAY(Text), nullable=True)
    subtopic_tags = Column(ARRAY(Text), nullable=True)
    effective_from = Column(DateTime, nullable=True)
    effective_to = Column(DateTime, nullable=True)
    is_approved = Column(Boolean, nullable=True)
    is_topic_tags_approved = Column(Boolean, nullable=True)
    is_condition_attributes_approved = Column(Boolean, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_standard_condition = Column(Boolean, nullable=True)
    requires_management_plan = Column(Boolean, nullable=True)
    condition_type = Column(
        Enum(ConditionType, name="condition_type_enum"),
        nullable=False,
        default=ConditionType.ADD,
    )

    # Establish a one-to-many relationship with subcondition
    subconditions = relationship('Subcondition', back_populates='condition', cascade='all, delete-orphan')

    __table_args__ = (
        {'schema': 'condition'}
    )

    @classmethod
    def get_conditions_by_project_id(cls, project_id):
        """Get all conditions for a specific project by project_id."""
        return cls.query.filter_by(project_id=project_id).all()

    @classmethod
    def get_conditions_by_document_id(cls, document_id):
        """Get all conditions for a specific document by document_id."""
        return cls.query.filter_by(document_id=document_id).all()

    @classmethod
    def get_by_id(cls, condition_id):
        """Get project by project_id."""
        return cls.query.filter_by(id=condition_id).first()
