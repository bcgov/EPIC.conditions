from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKeyConstraint, ARRAY
from .base_model import BaseModel

class Condition(BaseModel):
    """Definition of the Conditions entity."""
    __tablename__ = 'conditions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(String, nullable=False)
    document_id = Column(String, nullable=False)
    condition_name = Column(Text, nullable=True)
    condition_number = Column(Integer, nullable=True)
    condition_text = Column(Text, nullable=True)
    topic_tags = Column(ARRAY(Text), nullable=True)
    subtopic_tags = Column(ARRAY(Text), nullable=True)
    is_approved = Column(Boolean, nullable=True)
    deliverable_name = Column(Text, nullable=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ['project_id', 'document_id'],
            ['condition.projects.project_id', 'condition.projects.document_id'],
            ondelete='CASCADE'
        ),
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
