"""move_psn_fields_to_submissions

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-07-27 01:00:00.000000

Move condition_subsection and report_submission_type from reports to
report_submissions so each submission requirement can have its own type.
"""
from alembic import op
import sqlalchemy as sa


revision = 'f3a4b5c6d7e8'
down_revision = 'e2f3a4b5c6d7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('reports', schema='condition') as batch_op:
        batch_op.drop_column('condition_subsection')
        batch_op.drop_column('report_submission_type')

    with op.batch_alter_table('report_submissions', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('condition_subsection', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('report_submission_type', sa.String(), nullable=True))


def downgrade():
    with op.batch_alter_table('report_submissions', schema='condition') as batch_op:
        batch_op.drop_column('report_submission_type')
        batch_op.drop_column('condition_subsection')

    with op.batch_alter_table('reports', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('condition_subsection', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('report_submission_type', sa.String(), nullable=True))
