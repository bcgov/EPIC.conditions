"""Management Plan model class.

Manages the Management Plan
"""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text, text

from .base_model import BaseModel
from .db import db


class ManagementPlan(BaseModel):
    """Definition of the Management Plan entity."""

    __tablename__ = 'management_plans'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=True)
    is_approved = Column(Boolean, nullable=True, server_default=text('false'))

    @classmethod
    def get_all(cls):
        """Get all management plans."""
        return cls.query.all()

    @classmethod
    def get_by_condition_id(cls, condition_id):
        """Get management plans by condition ID."""
        return cls.query.filter_by(condition_id=condition_id).all()

    @classmethod
    def delete_by_id(cls, plan_id):
        """Delete a management plan by its ID."""
        plan = cls.query.filter_by(id=plan_id).one()
        if plan:
            db.session.delete(plan)
            db.session.commit()
            return True
        return True
