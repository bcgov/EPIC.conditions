"""remove_management_plan_name_attribute

Revision ID: f1a2b3c4d5e6
Revises: 0b5a70026d28
Create Date: 2026-03-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = '0b5a70026d28'
branch_labels = None
depends_on = None


def upgrade():
    # condition_attributes rows that reference this key are deleted automatically
    # via the ON DELETE CASCADE foreign key constraint.
    op.execute(
        """
        DELETE FROM condition.attribute_keys
        WHERE key_name = 'Management plan name(s)';
        """
    )


def downgrade():
    op.execute(
        """
        INSERT INTO condition.attribute_keys (id, key_name, external_key, sort_order, created_date)
        VALUES (3, 'Management plan name(s)', 'management_plan_name', 3, NOW())
        ON CONFLICT (id) DO NOTHING;
        """
    )
