"""make_few_staff_user_columns_nullable

Revision ID: 2ab69892d3a5
Revises: 8106bacbc0e3
Create Date: 2025-04-16 11:22:09.728571

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2ab69892d3a5'
down_revision = '8106bacbc0e3'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('attribute_keys', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('sort_order', sa.Integer(), nullable=True))

    with op.batch_alter_table('staff_users', schema='condition') as batch_op:
        batch_op.alter_column('position',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
        batch_op.alter_column('work_email_address',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
        batch_op.alter_column('work_contact_number',
               existing_type=sa.VARCHAR(length=50),
               nullable=True)
        
    # Mapping of id -> new sort_order
    id_to_sort_order = {
        1: 1,
        2: 3,
        3: 4,
        4: 5,
        5: 6,
        6: 7,
        7: 8,
        8: 9,
        9: 10,
        10: 11,
        11: 2,
    }

    for id_val, sort_order_val in id_to_sort_order.items():
        op.execute(
            sa.text(
                f"UPDATE condition.attribute_keys SET sort_order = :sort_order WHERE id = :id"
            ).bindparams(sort_order=sort_order_val, id=id_val)
        )

    with op.batch_alter_table('attribute_keys', schema='condition') as batch_op:
        batch_op.alter_column('sort_order', existing_type=sa.Integer(), nullable=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('staff_users', schema='condition') as batch_op:
        batch_op.alter_column('work_contact_number',
               existing_type=sa.VARCHAR(length=50),
               nullable=False)
        batch_op.alter_column('work_email_address',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
        batch_op.alter_column('position',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)

    with op.batch_alter_table('attribute_keys', schema='condition') as batch_op:
        batch_op.drop_column('sort_order')
    # ### end Alembic commands ###
