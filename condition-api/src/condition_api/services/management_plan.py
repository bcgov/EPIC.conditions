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


"""Service for condition attribute management."""
from marshmallow import ValidationError

from condition_api.models.db import db
from condition_api.models.condition import Condition
from condition_api.models.management_plan import ManagementPlan
from condition_api.models.report import Report
from condition_api.models.report_submission import ReportSubmission


class ManagementPlanService:
    """Service for managing management plan related operations."""

    @staticmethod
    def delete_management_plan(plan_id):
        """Delete a management plan and only the submissions directly linked to it.
        Parent reports are removed only if they have no remaining submissions."""
        linked_submissions = ReportSubmission.query.filter_by(
            linked_management_plan_id=plan_id
        ).all()
        affected_report_ids = list({s.report_id for s in linked_submissions})

        # Delete only the linked submissions, not the whole report
        for submission in linked_submissions:
            db.session.delete(submission)
        db.session.flush()

        # Remove parent reports that are now empty
        for report_id in affected_report_ids:
            report = Report.query.filter_by(id=report_id).first()
            if report and len(report.submissions) == 0:
                db.session.delete(report)

        plan = ManagementPlan.query.filter_by(id=plan_id).one_or_none()
        if not plan:
            db.session.commit()
            return False
        db.session.delete(plan)
        db.session.commit()
        return True

    @staticmethod
    def get_linked_report_count(plan_id):
        """Return the number of distinct reports linked to a management plan."""
        linked = ReportSubmission.query.filter_by(
            linked_management_plan_id=plan_id
        ).all()
        return len({s.report_id for s in linked})

    @staticmethod
    def update_management_plan_name(plan_id, payload):
        """Update a management plan name"""
        plan = ManagementPlan.find_by_id(plan_id)
        if not plan:
            raise ValueError("Management Plan not found for the given ID.")

        # Update name if present
        if "name" in payload:
            name = payload["name"]
            if not isinstance(name, str) or not name.strip():
                raise ValidationError("Management plan name cannot be blank.")
            plan.name = name.strip()

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
