"""set_is_active_for_existing_records

Revision ID: 0b5a70026d28
Revises: a3f2b8c91d47
Create Date: 2026-02-25

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '0b5a70026d28'
down_revision = 'a3f2b8c91d47'
branch_labels = None
depends_on = None


def upgrade():
    # Set is_active = true for all existing records not created by cronjob
    op.execute("""
        UPDATE condition.projects
        SET is_active = true
        WHERE created_by != 'cronjob'
    """)

    op.execute("""
        UPDATE condition.documents
        SET is_active = true
        WHERE created_by != 'cronjob'
    """)


def downgrade():
    # Revert all records back to is_active = false
    op.execute("""
        UPDATE condition.projects
        SET is_active = false
    """)

    op.execute("""
        UPDATE condition.documents
        SET is_active = false
    """)
