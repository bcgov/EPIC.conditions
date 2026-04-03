"""add_extracted_data_to_extraction_requests

Revision ID: 78ed21d16c76
Revises: c3d4e5f6a7b8
Create Date: 2026-04-03 12:12:01.444946

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '78ed21d16c76'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('extraction_requests', sa.Column('extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True), schema='condition')


def downgrade():
    op.drop_column('extraction_requests', 'extracted_data', schema='condition')
