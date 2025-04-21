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
"""Enum definitions."""
from enum import IntEnum


class UserStatus(IntEnum):
    """User status."""

    ACTIVE = 1
    INACTIVE = 2

class DocumentType(IntEnum):
    """Document type."""

    Amendment = 3

class AttributeKeys(IntEnum):
    """Attribute Keys."""
    # The numbers are same as the id for each attribute key within the table attribute_keys
    REQUIRES_MANAGEMENT_PLAN = 1
    REQUIRES_CONSULTATION = 2
    MANAGEMENT_PLAN_NAME = 3
    MANAGEMENT_PLAN_ACRONYM = 4
    PARTIES_REQUIRED_TO_BE_CONSULTED = 6
    SUBMITTED_TO_EAO_FOR = 7
    TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE = 8
    MILESTONES_RELATED_TO_PLAN_SUBMISSION = 9
    MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION = 10
    REQUIRES_IEM_TERMS_OF_ENGAGEMENT = 11
