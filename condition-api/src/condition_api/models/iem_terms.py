"""IEM Terms model class.

Manages the IEM Terms of Engagement
"""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text, text

from .base_model import BaseModel
from .db import db


class IEMTerms(BaseModel):
    """Definition of the IEM Terms of Engagement entity."""

    __tablename__ = 'iem_terms'
    __table_args__ = {'schema': 'condition'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    condition_id = Column(Integer, ForeignKey('condition.conditions.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=True)
    is_approved = Column(Boolean, nullable=True, server_default=text('false'))

    @classmethod
    def get_all(cls):
        """Get all IEM terms."""
        return cls.query.all()

    @classmethod
    def get_by_condition_id(cls, condition_id):
        """Get IEM terms by condition ID."""
        return cls.query.filter_by(condition_id=condition_id).all()

    @classmethod
    def delete_by_id(cls, terms_id):
        """Delete an IEM terms package by its ID."""
        terms = cls.query.filter_by(id=terms_id).one()
        if terms:
            db.session.delete(terms)
            db.session.commit()
            return True
        return True
