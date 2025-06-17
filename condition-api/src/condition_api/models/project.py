"""Project model class.

Manages the project
"""
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.schema import UniqueConstraint

from .base_model import BaseModel

Base = declarative_base()


class Project(BaseModel):
    """Definition of the Projects entity."""

    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(255), nullable=False, unique=True)
    project_name = Column(Text)
    project_type = Column(Text)

    # Establish a one-to-many relationship with the Document table
    documents = relationship('Document', back_populates='project', cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('project_id', name='uq_project'),
        {'schema': 'condition'},
    )

    @classmethod
    def get_all(cls):
        """Get all projects."""
        return cls.query.all()

    @classmethod
    def get_by_id(cls, project_id):
        """Get project by project_id."""
        return cls.query.filter_by(project_id=project_id).first()
