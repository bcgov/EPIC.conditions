"""allow_amendment_in_other_orders_category

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-08-04

Allow Amendment (type 3) to be created under the Other Orders category (id 3)
by adding the missing row to document_type_categories.
"""
from alembic import op

revision = 'c2d3e4f5a6b7'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        INSERT INTO condition.document_type_categories
            (document_type_id, document_category_id, created_date, updated_date)
        VALUES
            (3, 3, NOW(), NOW())   -- Amendment → Other Orders
        ON CONFLICT (document_type_id, document_category_id) DO NOTHING;
    """)


def downgrade():
    op.execute("""
        DELETE FROM condition.document_type_categories
        WHERE document_type_id = 3 AND document_category_id = 3;
    """)
