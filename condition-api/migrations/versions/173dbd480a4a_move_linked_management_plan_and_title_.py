"""move_linked_management_plan_and_title_to_report_submission

Revision ID: 173dbd480a4a
Revises: 1c1f10d637dc
Create Date: 2026-08-13 09:25:03.679202

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '173dbd480a4a'
down_revision = '1c1f10d637dc'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('report_submissions',
        sa.Column('linked_management_plan_id', sa.Integer(), nullable=True),
        schema='condition'
    )
    op.add_column('report_submissions',
        sa.Column('report_title', sa.Text(), nullable=True),
        schema='condition'
    )
    op.create_foreign_key(
        'fk_report_submissions_management_plan',
        'report_submissions', 'management_plans',
        ['linked_management_plan_id'], ['id'],
        source_schema='condition', referent_schema='condition',
        ondelete='SET NULL'
    )

    # Migrate existing report-level data down to all submissions of that report.
    op.execute("""
        UPDATE condition.report_submissions rs
        SET linked_management_plan_id = r.linked_management_plan_id,
            report_title              = r.report_title
        FROM condition.reports r
        WHERE rs.report_id = r.id
          AND (r.linked_management_plan_id IS NOT NULL OR r.report_title IS NOT NULL)
    """)

    op.drop_constraint('reports_linked_management_plan_id_fkey', 'reports', schema='condition', type_='foreignkey')
    op.drop_column('reports', 'linked_management_plan_id', schema='condition')
    op.drop_column('reports', 'report_title', schema='condition')


def downgrade():
    op.add_column('reports',
        sa.Column('linked_management_plan_id', sa.Integer(), nullable=True),
        schema='condition'
    )
    op.add_column('reports',
        sa.Column('report_title', sa.Text(), nullable=True),
        schema='condition'
    )
    op.create_foreign_key(
        'reports_linked_management_plan_id_fkey',
        'reports', 'management_plans',
        ['linked_management_plan_id'], ['id'],
        source_schema='condition', referent_schema='condition',
        ondelete='SET NULL'
    )

    # Best-effort restore: copy first submission's values back to the report.
    op.execute("""
        UPDATE condition.reports r
        SET linked_management_plan_id = sub.linked_management_plan_id,
            report_title              = sub.report_title
        FROM (
            SELECT DISTINCT ON (report_id) report_id, linked_management_plan_id, report_title
            FROM condition.report_submissions
            ORDER BY report_id, id
        ) sub
        WHERE r.id = sub.report_id
    """)

    op.drop_constraint('fk_report_submissions_management_plan', 'report_submissions', schema='condition', type_='foreignkey')
    op.drop_column('report_submissions', 'linked_management_plan_id', schema='condition')
    op.drop_column('report_submissions', 'report_title', schema='condition')
