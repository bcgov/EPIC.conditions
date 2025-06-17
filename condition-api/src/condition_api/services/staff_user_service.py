"""Service for staff user management."""
from condition_api.models.staff_user import StaffUser

from flask import g


class StaffUserService:
    """Service for managing staff users."""

    @classmethod
    def get_by_auth_guid(cls, auth_guid: str) -> StaffUser:
        """Retrieve a staff user by their auth GUID."""
        user = StaffUser.get_user_by_auth_guid(auth_guid)
        if not user:
            token_info = g.jwt_oidc_token_info
            user = StaffUser.create_user(token_info)
        return user

    @classmethod
    def create_or_update_staff_user(cls, data: dict) -> StaffUser:
        """Create a new staff user or update an existing one."""
        auth_guid = data.get("auth_guid")
        if cls.is_existing_user(auth_guid):
            # If user exists, update their information
            return StaffUser.update_user(auth_guid, data)

        # Otherwise, create a new user
        return StaffUser.create_user(data)

    @classmethod
    def is_existing_user(cls, auth_guid: str) -> bool:
        """Check if a staff user with the given auth GUID exists."""
        return bool(StaffUser.get_user_by_auth_guid(auth_guid))
