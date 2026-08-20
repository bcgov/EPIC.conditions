"""add_reports_table

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-07-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e2f3a4b5c6d7'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('condition_id', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(), nullable=False),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['condition_id'], ['condition.conditions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='condition'
    )

    op.create_table(
        'report_submissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('phase', sa.String(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=True),
        sa.Column('timing', sa.Text(), nullable=True),
        sa.Column('condition_subsection', sa.Text(), nullable=True),
        sa.Column('report_submission_type', sa.String(), nullable=True),
        sa.Column('is_approved', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('linked_management_plan_id', sa.Integer(), nullable=True),
        sa.Column('report_title', sa.Text(), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['report_id'], ['condition.reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['linked_management_plan_id'], ['condition.management_plans.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='condition'
    )

    with op.batch_alter_table('conditions', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('requires_report', sa.Boolean(), nullable=True))


def downgrade():
    with op.batch_alter_table('conditions', schema='condition') as batch_op:
        batch_op.drop_column('requires_report')

    op.drop_table('report_submissions', schema='condition')
    op.drop_table('reports', schema='condition')
