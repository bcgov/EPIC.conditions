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


"""Service for condition attribute management."""
from condition_api.models.db import db
from condition_api.models.condition import Condition
from condition_api.models.management_plan import ManagementPlan


class ManagementPlanService:
    """Service for managing management plan related operations."""

    @staticmethod
    def update_management_plan_name(plan_id, payload):
        """Update a management plan name"""
        plan = ManagementPlan.find_by_id(plan_id)
        if not plan:
            raise ValueError("Management Plan not found for the given ID.")

        # Update name if present
        if "name" in payload:
            plan.name = payload["name"]

        # Update is_approved if present
        if "is_approved" in payload:
            plan.is_approved = payload["is_approved"]

            condition = Condition.query.get(plan.condition_id)
            all_plans = ManagementPlan.query.filter_by(condition_id=plan.condition_id).all()
            all_approved = all(p.is_approved for p in all_plans)
            if all_approved:
                # Update the related condition
                if condition:
                    condition.is_condition_attributes_approved = True
            else:
                condition.is_condition_attributes_approved = False

        db.session.commit()
        return plan
