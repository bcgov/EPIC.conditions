"""Project model class.

Manages the project
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, Date, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.schema import UniqueConstraint

from .base_model import BaseModel

Base = declarative_base()

class Project(BaseModel):
    """Definition of the Projects entity."""
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String(255), nullable=False)
    project_name = Column(Text)
    document_id = Column(String(255), nullable=False)
    display_name = Column(Text)
    document_file_name = Column(Text)
    date_issued = Column(Date)
    act = Column(Integer)
    first_nations = Column(ARRAY(Text))
    consultation_records_required = Column(Boolean)

    __table_args__ = (
        UniqueConstraint('project_id', 'document_id', name='uq_project_document'),
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
