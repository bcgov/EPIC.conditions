# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Service for staff user management."""

from flask import g

from condition_api.models.staff_user import StaffUser


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
