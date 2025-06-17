"""Staff User model class.

Manages the staff user
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Column, ForeignKey, func
from sqlalchemy.orm import column_property

from ..utils.enums import UserStatus

from .base_model import BaseModel
from .db import db


class StaffUser(BaseModel):
    """Definition of the Staff User entity."""

    __tablename__ = 'staff_users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = Column(db.String(50), nullable=False)
    middle_name = Column(db.String(50), nullable=True)
    last_name = Column(db.String(50), nullable=False)
    full_name = column_property(first_name + ' ' + last_name)
    position = Column(db.String(100), nullable=True)
    work_email_address = Column(db.String(100), nullable=True)
    work_contact_number = Column(db.String(50), nullable=True)
    auth_guid = Column(db.String(), nullable=False, index=True, unique=True)
    status_id = db.Column(db.Integer, ForeignKey('condition.user_status.id'), nullable=False, default=1)

    __table_args__ = (
        {'schema': 'condition'}
    )

    @classmethod
    def get_user_by_auth_guid(cls, _auth_guid, include_inactive=False) -> Optional[StaffUser]:
        """Get a user with the provided auth guid."""
        query = db.session.query(StaffUser) \
            .filter(func.lower(StaffUser.auth_guid) == func.lower(_auth_guid))

        if not include_inactive:
            query = query.filter(StaffUser.status_id == UserStatus.ACTIVE.value)

        return query.first()

    @classmethod
    def create_user(cls, user) -> StaffUser:
        """Create user."""
        user = StaffUser(
            first_name=user.get('given_name', None),
            last_name=user.get('family_name', None),
            position=user.get('position', ""),
            work_email_address=user.get('email', None),
            work_contact_number=user.get('work_contact_number', ""),
            auth_guid=user.get('sub', None),
        )
        user.save()

        return user

    @classmethod
    def update_user(cls, auth_guid, user_dict) -> Optional[StaffUser]:
        """Update user."""
        query = StaffUser.query.filter_by(auth_guid=auth_guid)
        user: StaffUser = query.first()
        if not user:
            return None

        update_fields = dict(
            first_name=user_dict.get('first_name', user.first_name),
            middle_name=user_dict.get('middle_name', user.middle_name),
            last_name=user_dict.get('last_name', user.last_name),
            position=user_dict.get('position', user.position),
            work_email_address=user_dict.get('work_email_address', user.work_email_address),
            work_contact_number=user_dict.get('work_contact_number', user.work_contact_number),
            auth_guid=user_dict.get('auth_guid', user.auth_guid),
        )
        query.update(update_fields)
        db.session.commit()
        return user
