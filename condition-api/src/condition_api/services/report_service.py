"""Service for report management."""

from condition_api.models.condition import Condition
from condition_api.models.db import db
from condition_api.models.management_plan import ManagementPlan
from condition_api.models.report import Report
from condition_api.models.report_submission import ReportSubmission
from condition_api.services.condition_approval_service import ConditionApprovalService


def _serialize_submission_external(submission, plan_by_id):
    linked_plan = (
        plan_by_id.get(submission.linked_management_plan_id)
        if submission.linked_management_plan_id else None
    )
    return {
        'id': submission.id,
        'phase': submission.phase,
        'frequency': submission.frequency,
        'timing': submission.timing,
        'condition_subsection': submission.condition_subsection,
        'report_submission_type': submission.report_submission_type,
        'report_title': submission.report_title,
        'management_plan': linked_plan.name if linked_plan else None,
    }


def _serialize_report_external(report, condition, plan_by_id):
    # Only expose individually-approved submissions. A newly-added (unapproved)
    # submission must not appear externally, while the already-approved ones on
    # the same report stay available.
    approved_submissions = [s for s in report.submissions if s.is_approved]
    return {
        'id': report.id,
        'condition_name': condition.condition_name,
        'condition_number': condition.condition_number,
        'report_type': report.report_type,
        'submissions': [_serialize_submission_external(s, plan_by_id) for s in approved_submissions],
    }


def _serialize_submission(submission):
    return {
        'id': submission.id,
        'report_id': submission.report_id,
        'phase': submission.phase,
        'frequency': submission.frequency,
        'timing': submission.timing,
        'condition_subsection': submission.condition_subsection,
        'report_submission_type': submission.report_submission_type,
        'is_approved': submission.is_approved or False,
        'linked_management_plan_id': submission.linked_management_plan_id,
        'report_title': submission.report_title,
    }


def _serialize_report(report):
    return {
        'id': report.id,
        'condition_id': report.condition_id,
        'report_type': report.report_type,
        'name': report.name,
        'recipients': report.recipients,
        'submissions': [_serialize_submission(s) for s in report.submissions],
    }


class ReportService:
    """Service for managing report related operations."""

    @staticmethod
    def get_reports_by_condition(condition_id):
        """Fetch all reports with submissions for a condition."""
        reports = Report.get_by_condition_id(condition_id)
        return [_serialize_report(r) for r in reports]

    @staticmethod
    def get_approved_reports_by_project(project_id):
        """Fetch all reports (with approved submissions) for published conditions in a project.

        For external consumption: includes reports belonging to conditions that are
        active and published externally — the same gate as the external
        consolidated-conditions endpoint (is_active, is_approved, is_topic_tags_approved).
        We intentionally do NOT require is_condition_attributes_approved: that flag is
        the AND of every attribute package and drops to "awaiting" the moment a new
        draft package/submission is added, which must not withdraw a condition's
        already-approved reports. Each report is then filtered to its individually
        approved submissions (see _serialize_report_external), and reports left with no
        approved submissions are dropped.
        """
        reports = (
            Report.query
            .join(Condition, Condition.id == Report.condition_id)
            .filter(
                Condition.project_id == project_id,
                Condition.is_active.is_(True),
                Condition.is_approved.is_(True),
                Condition.is_topic_tags_approved.is_(True),
            )
            .all()
        )

        if not reports:
            return []

        condition_by_id = {
            c.id: c for c in Condition.query.filter(
                Condition.id.in_({r.condition_id for r in reports})
            ).all()
        }

        plan_ids = {
            s.linked_management_plan_id
            for r in reports for s in r.submissions
            if s.linked_management_plan_id
        }
        plan_by_id = (
            {p.id: p for p in ManagementPlan.query.filter(ManagementPlan.id.in_(plan_ids)).all()}
            if plan_ids else {}
        )

        serialized = [
            _serialize_report_external(r, condition_by_id[r.condition_id], plan_by_id)
            for r in reports
        ]
        # Drop reports that have no approved submissions to expose externally.
        return [r for r in serialized if r["submissions"]]

    @staticmethod
    def create_report(condition_id, payload):
        """Create a report and its initial submissions."""
        report = Report(
            condition_id=condition_id,
            report_type=payload.get('report_type', ''),
            name=payload.get('name'),
            recipients=payload.get('recipients'),
        )
        db.session.add(report)
        db.session.flush()

        linked_management_plan_id = payload.get('linked_management_plan_id')
        report_title = payload.get('report_title')

        for sub_data in payload.get('submissions', []):
            phases = sub_data.get('phases') or [sub_data.get('phase', 'Phase-Agnostic (submittable at any point)')]
            for phase in phases:
                db.session.add(ReportSubmission(
                    report_id=report.id,
                    phase=phase,
                    frequency=sub_data.get('frequency'),
                    timing=sub_data.get('timing'),
                    condition_subsection=sub_data.get('condition_subsection'),
                    report_submission_type=sub_data.get('report_submission_type'),
                    is_approved=False,
                    linked_management_plan_id=linked_management_plan_id,
                    report_title=report_title,
                ))

        condition = Condition.query.get(condition_id)
        if condition:
            condition.requires_report = True

        db.session.flush()
        ConditionApprovalService.recompute_attributes_approved(condition_id)
        db.session.commit()
        db.session.refresh(report)
        return _serialize_report(report)

    @staticmethod
    def delete_report(report_id):
        """Delete a report and clear requires_report on condition if no reports remain."""
        report = Report.find_by_id(report_id)
        if not report:
            return False
        condition_id = report.condition_id
        db.session.delete(report)
        db.session.flush()
        remaining = Report.query.filter_by(condition_id=condition_id).count()
        if remaining == 0:
            condition = Condition.query.get(condition_id)
            if condition:
                condition.requires_report = False
        ConditionApprovalService.recompute_attributes_approved(condition_id)
        db.session.commit()
        return True

    @staticmethod
    def update_report(report_id, payload):
        """Update report metadata fields."""
        report = Report.find_by_id(report_id)
        if not report:
            raise ValueError("Report not found.")

        for field in ['report_type', 'name', 'recipients']:
            if field in payload:
                setattr(report, field, payload[field])

        db.session.commit()
        db.session.refresh(report)
        return _serialize_report(report)

    @staticmethod
    def update_submission(submission_id, payload):
        """Update a report submission, including approval."""
        submission = ReportSubmission.find_by_id(submission_id)
        if not submission:
            raise ValueError("Report submission not found.")

        for field in ['phase', 'frequency', 'timing', 'condition_subsection', 'report_submission_type',
                      'is_approved', 'linked_management_plan_id', 'report_title']:
            if field in payload:
                setattr(submission, field, payload[field])

        if 'is_approved' in payload:
            report = Report.find_by_id(submission.report_id)
            if report:
                ConditionApprovalService.recompute_attributes_approved(report.condition_id)

        db.session.commit()
        return _serialize_submission(submission)

    @staticmethod
    def add_submission(report_id, payload):
        """Add one or more submissions (phases) to an existing report."""
        report = Report.find_by_id(report_id)
        if not report:
            raise ValueError("Report not found.")

        phases = payload.get('phases') or [payload.get('phase', 'Phase-Agnostic (submittable at any point)')]
        new_submissions = []
        for phase in phases:
            sub = ReportSubmission(
                report_id=report_id,
                phase=phase,
                frequency=payload.get('frequency'),
                timing=payload.get('timing'),
                condition_subsection=payload.get('condition_subsection'),
                report_submission_type=payload.get('report_submission_type'),
                is_approved=False,
            )
            db.session.add(sub)
            new_submissions.append(sub)

        db.session.flush()
        ConditionApprovalService.recompute_attributes_approved(report.condition_id)
        db.session.commit()
        return [_serialize_submission(s) for s in new_submissions]

    @staticmethod
    def delete_submission(submission_id):
        """Delete a report submission and recompute the condition's approval flag."""
        submission = ReportSubmission.query.filter_by(id=submission_id).one_or_none()
        if not submission:
            return False
        report = Report.find_by_id(submission.report_id)
        condition_id = report.condition_id if report else None
        db.session.delete(submission)
        db.session.flush()
        if condition_id:
            ConditionApprovalService.recompute_attributes_approved(condition_id)
        db.session.commit()
        return True
