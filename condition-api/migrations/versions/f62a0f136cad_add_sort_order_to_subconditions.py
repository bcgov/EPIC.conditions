"""add_sort_order_to_subconditions

Revision ID: f62a0f136cad
Revises: 6c06ecce254a
Create Date: 2025-06-06 13:23:52.611314

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f62a0f136cad'
down_revision = '6c06ecce254a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('subconditions', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('sort_order', sa.Integer(), nullable=True))

    # Populate sort_order grouped by condition_id and ordered by id
    op.execute("""
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (PARTITION BY condition_id ORDER BY id) AS new_sort_order
            FROM condition.subconditions
        )
        UPDATE condition.subconditions
        SET sort_order = ranked.new_sort_order
        FROM ranked
        WHERE condition.subconditions.id = ranked.id
    """)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('subconditions', schema='condition') as batch_op:
        batch_op.drop_column('sort_order')
    # ### end Alembic commands ###
