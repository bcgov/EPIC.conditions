"""add_is_active_to_projects_and_documents

Revision ID: a3f2b8c91d47
Revises: 1eb403b982a4
Create Date: 2026-02-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3f2b8c91d47'
down_revision = '1eb403b982a4'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_active column to projects table with default True
    with op.batch_alter_table('projects', schema='condition') as batch_op:
        batch_op.add_column(
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false'))
        )

    # Add is_active column to documents table with default True
    with op.batch_alter_table('documents', schema='condition') as batch_op:
        batch_op.add_column(
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('false'))
        )

    # Set is_active = False for any records created by the cronjob
    op.execute("""
        UPDATE condition.projects
        SET is_active = false
        WHERE created_by = 'cronjob'
    """)

    op.execute("""
        UPDATE condition.documents
        SET is_active = false
        WHERE created_by = 'cronjob'
    """)


def downgrade():
    with op.batch_alter_table('documents', schema='condition') as batch_op:
        batch_op.drop_column('is_active')

    with op.batch_alter_table('projects', schema='condition') as batch_op:
        batch_op.drop_column('is_active')
