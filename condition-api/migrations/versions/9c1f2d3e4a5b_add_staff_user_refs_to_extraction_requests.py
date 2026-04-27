"""add_staff_user_refs_to_extraction_requests

Revision ID: 9c1f2d3e4a5b
Revises: c3d4e5f6a7b8
Create Date: 2026-04-23 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9c1f2d3e4a5b'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    """Add explicit staff user foreign keys for upload/import attribution."""
    with op.batch_alter_table("extraction_requests", schema="condition") as batch_op:
        batch_op.add_column(sa.Column("uploaded_by_staff_user_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("imported_by_staff_user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_extraction_requests_uploaded_by_staff_user_id",
            "staff_users",
            ["uploaded_by_staff_user_id"],
            ["id"],
            referent_schema="condition",
        )
        batch_op.create_foreign_key(
            "fk_extraction_requests_imported_by_staff_user_id",
            "staff_users",
            ["imported_by_staff_user_id"],
            ["id"],
            referent_schema="condition",
        )
        batch_op.create_index(
            "ix_condition_extraction_requests_uploaded_by_staff_user_id",
            ["uploaded_by_staff_user_id"],
        )
        batch_op.create_index(
            "ix_condition_extraction_requests_imported_by_staff_user_id",
            ["imported_by_staff_user_id"],
        )

    op.execute(
        """
        UPDATE condition.extraction_requests er
        SET uploaded_by_staff_user_id = su.id
        FROM condition.staff_users su
        WHERE er.created_by = su.auth_guid
          AND er.uploaded_by_staff_user_id IS NULL
        """
    )

    op.execute(
        """
        UPDATE condition.extraction_requests er
        SET imported_by_staff_user_id = su.id
        FROM condition.staff_users su
        WHERE er.updated_by = su.auth_guid
          AND er.status = 'imported'
          AND er.imported_by_staff_user_id IS NULL
        """
    )


def downgrade():
    """Remove explicit staff user foreign keys for upload/import attribution."""
    with op.batch_alter_table("extraction_requests", schema="condition") as batch_op:
        batch_op.drop_index("ix_condition_extraction_requests_imported_by_staff_user_id")
        batch_op.drop_index("ix_condition_extraction_requests_uploaded_by_staff_user_id")
        batch_op.drop_constraint("fk_extraction_requests_imported_by_staff_user_id", type_="foreignkey")
        batch_op.drop_constraint("fk_extraction_requests_uploaded_by_staff_user_id", type_="foreignkey")
        batch_op.drop_column("imported_by_staff_user_id")
        batch_op.drop_column("uploaded_by_staff_user_id")
