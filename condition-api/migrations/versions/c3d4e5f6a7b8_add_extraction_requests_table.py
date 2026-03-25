"""add_extraction_requests_table

Revision ID: c3d4e5f6a7b8
Revises: f1a2b3c4d5e6
Create Date: 2026-03-24

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'extraction_requests',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_id', sa.String(255), sa.ForeignKey('condition.projects.project_id'), nullable=False),
        sa.Column('document_id', sa.String(255), nullable=True),
        sa.Column('document_type_id', sa.Integer(), sa.ForeignKey('condition.document_types.id'), nullable=True),
        sa.Column('document_label', sa.Text(), nullable=True),
        sa.Column('s3_url', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_date', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        schema='condition',
    )


def downgrade():
    op.drop_table('extraction_requests', schema='condition')
