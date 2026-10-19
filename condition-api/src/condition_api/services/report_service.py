"""Service for report management."""

from condition_api.models.condition import Condition
from condition_api.models.db import db
from condition_api.models.management_plan import ManagementPlan
from condition_api.models.report import Report
from condition_api.models.report_submission import ReportSubmission


def _serialize_submission_external(submission, plan_by_id):
    linked_plan = (
        plan_by_id.get(submission.linked_management_plan_id)
        if submission.linked_management_plan_id else None
    )
    return {
        'phase': submission.phase,
        'frequency': submission.frequency,
        'timing': submission.timing,
        'condition_subsection': submission.condition_subsection,
        'report_submission_type': submission.report_submission_type,
        'report_title': submission.report_title,
        'management_plan': linked_plan.name if linked_plan else None,
    }


def _serialize_report_external(report, condition, plan_by_id):
    return {
        'id': report.id,
        'condition_name': condition.condition_name,
        'condition_number': condition.condition_number,
        'report_type': report.report_type,
        'submissions': [_serialize_submission_external(s, plan_by_id) for s in report.submissions],
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
        """Fetch all reports (with submissions) for approved conditions in a project.

        For external consumption: only includes reports belonging to conditions that
        have cleared the same approval gate as the external consolidated-conditions
        endpoint (is_approved, is_condition_attributes_approved, is_topic_tags_approved
        all True) — which, by construction, means every submission on these reports is
        itself already approved too.
        """
        reports = (
            Report.query
            .join(Condition, Condition.id == Report.condition_id)
            .filter(
                Condition.project_id == project_id,
                Condition.is_approved.is_(True),
                Condition.is_condition_attributes_approved.is_(True),
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

        return [
            _serialize_report_external(r, condition_by_id[r.condition_id], plan_by_id)
            for r in reports
        ]

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
            phases = sub_data.get('phases') or [sub_data.get('phase', 'All Phases')]
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
                condition = Condition.query.get(report.condition_id)
                all_reports = Report.get_by_condition_id(report.condition_id)
                all_approved = bool(all_reports) and all(
                    s.is_approved
                    for r in all_reports
                    for s in r.submissions
                )
                if condition:
                    condition.is_condition_attributes_approved = all_approved

        db.session.commit()
        return _serialize_submission(submission)

    @staticmethod
    def add_submission(report_id, payload):
        """Add one or more submissions (phases) to an existing report."""
        report = Report.find_by_id(report_id)
        if not report:
            raise ValueError("Report not found.")

        phases = payload.get('phases') or [payload.get('phase', 'All Phases')]
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

        db.session.commit()
        return [_serialize_submission(s) for s in new_submissions]
