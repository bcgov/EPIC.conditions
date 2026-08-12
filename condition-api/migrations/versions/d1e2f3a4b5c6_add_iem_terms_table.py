"""add_iem_terms_table

Revision ID: d1e2f3a4b5c6
Revises: b1c2d3e4f5a6
Create Date: 2026-07-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'd1e2f3a4b5c6'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'iem_terms',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('condition_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.Text(), nullable=True),
        sa.Column('is_approved', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['condition_id'], ['condition.conditions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        schema='condition'
    )

    with op.batch_alter_table('condition_attributes', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('iem_terms_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            None, 'iem_terms', ['iem_terms_id'], ['id'],
            referent_schema='condition', ondelete='CASCADE'
        )

    with op.batch_alter_table('conditions', schema='condition') as batch_op:
        batch_op.add_column(sa.Column('requires_iem_terms', sa.Boolean(), nullable=True))


def downgrade():
    with op.batch_alter_table('conditions', schema='condition') as batch_op:
        batch_op.drop_column('requires_iem_terms')

    with op.batch_alter_table('condition_attributes', schema='condition') as batch_op:
        batch_op.drop_column('iem_terms_id')

    op.drop_table('iem_terms', schema='condition')
