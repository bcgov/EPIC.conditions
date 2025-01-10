"""The Authorization service.

This module is to handle authorization related queries.
"""
from condition_api.utils.user_context import UserContext, user_context


# pylint: disable=unused-argument
@user_context
def check_auth(**kwargs):
    """Check if user is authorized to perform action on the service."""
    user_from_context: UserContext = kwargs['user_context']
    token_roles = set(user_from_context.roles)
    has_valid_roles = token_roles
    if has_valid_roles:
        return True

    return False
