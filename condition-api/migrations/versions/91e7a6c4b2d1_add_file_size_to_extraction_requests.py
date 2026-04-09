"""add_extraction_request_file_metadata

Revision ID: 91e7a6c4b2d1
Revises: 78ed21d16c76
Create Date: 2026-04-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '91e7a6c4b2d1'
down_revision = '78ed21d16c76'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'extraction_requests',
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        schema='condition',
    )
    op.add_column(
        'extraction_requests',
        sa.Column('original_file_name', sa.Text(), nullable=True),
        schema='condition',
    )


def downgrade():
    op.drop_column('extraction_requests', 'original_file_name', schema='condition')
    op.drop_column('extraction_requests', 'file_size_bytes', schema='condition')
