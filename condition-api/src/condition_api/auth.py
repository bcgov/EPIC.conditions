# Copyright © 2024 Province of British Columbia
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
"""Bring in the common JWT Manager."""
from functools import wraps

from flask import g, request

from flask_jwt_oidc import JwtManager
from flask_jwt_oidc.exceptions import AuthError


jwt = (
    JwtManager()
)  # pylint: disable=invalid-name; lower case name as used by convention in most Flask apps


class Auth:  # pylint: disable=too-few-public-methods
    """Extending JwtManager to include additional functionalities."""

    @classmethod
    def require(cls, f):
        """Validate the Bearer Token."""

        @jwt.requires_auth
        @wraps(f)
        def decorated(*args, **kwargs):
            g.authorization_header = request.headers.get("Authorization", None)
            g.token_info = g.jwt_oidc_token_info

            return f(*args, **kwargs)

        return decorated

    @classmethod
    def optional(cls, f):
        """Validate an optional Bearer Token."""

        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                token = jwt.get_token_auth_header()
                # pylint: disable=protected-access
                jwt._validate_token(token)
                g.authorization_header = request.headers.get('Authorization', None)
                g.token_info = g.jwt_oidc_token_info
            except AuthError:
                g.authorization_header = None
                g.token_info = None
            return f(*args, **kwargs)

        return decorated

    @classmethod
    def has_one_of_roles(cls, roles):
        """Check that at least one of the realm roles are in the token.

        Args:
            roles (list[str]): List of valid roles
        """
        return jwt.has_one_of_roles(roles)


auth = Auth()
