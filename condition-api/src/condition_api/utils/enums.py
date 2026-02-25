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
"""Enum definitions."""
from enum import IntEnum, Enum
from typing import List


class UserStatus(IntEnum):
    """User status."""

    ACTIVE = 1
    INACTIVE = 2


class DocumentType(IntEnum):
    """Document type."""

    Amendment = 3


class AttributeKeys(str, Enum):
    """Attribute Keys — values match key_name in the attribute_keys table."""

    REQUIRES_CONSULTATION = "Requires consultation"
    MANAGEMENT_PLAN_NAME = "Management plan name(s)"
    MANAGEMENT_PLAN_ACRONYM = "Management plan acronym(s)"
    PARTIES_REQUIRED_TO_BE_SUBMITTED = "Parties required to be submitted"
    PARTIES_REQUIRED_TO_BE_CONSULTED = "Parties required to be consulted"
    SUBMITTED_TO_EAO_FOR = "Submitted to EAO for"
    TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE = "Time associated with submission milestone"
    MILESTONES_RELATED_TO_PLAN_SUBMISSION = "Milestone(s) related to plan submission"
    MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION = "Project phases(s) related to plan implementation"
    REQUIRES_IEM_TERMS_OF_ENGAGEMENT = "Requires IEM Terms of Engagement"
    DELIVERABLE_NAME = "Deliverable name"


class IEMTermsConfig:
    """IEM Terms"""

    DELIVERABLE_VALUE = "Independent Environmental Monitor Terms of Engagement"

    @staticmethod
    def required_attribute_keys() -> List[str]:
        """Required attribute key_names for IEM"""
        return [
            AttributeKeys.SUBMITTED_TO_EAO_FOR.value,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_SUBMISSION.value,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION.value,
            AttributeKeys.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE.value,
            AttributeKeys.REQUIRES_CONSULTATION.value,
            AttributeKeys.DELIVERABLE_NAME.value,
        ]


class ManagementPlanConfig:
    """Management Plan"""

    @staticmethod
    def required_attribute_keys() -> List[str]:
        """Required attribute key_names for Management Plan"""
        return [
            AttributeKeys.SUBMITTED_TO_EAO_FOR.value,
            AttributeKeys.MANAGEMENT_PLAN_NAME.value,
            AttributeKeys.MANAGEMENT_PLAN_ACRONYM.value,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_SUBMISSION.value,
            AttributeKeys.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION.value,
            AttributeKeys.TIME_ASSOCIATED_WITH_SUBMISSION_MILESTONE.value,
            AttributeKeys.REQUIRES_CONSULTATION.value,
        ]


class ConditionType(Enum):
    """Condition Type — whether a condition is newly added or an amendment."""

    ADD = "add"
    AMEND = "amend"
