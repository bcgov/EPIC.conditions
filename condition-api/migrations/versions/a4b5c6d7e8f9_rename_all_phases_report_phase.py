"""rename 'All Phases' report submission phase to 'Phase-Agnostic (submittable at any point)'

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-11-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a4b5c6d7e8f9'
down_revision = 'f3a4b5c6d7e8'
branch_labels = None
depends_on = None

OLD_PHASE = 'All Phases'
NEW_PHASE = 'Phase-Agnostic (submittable at any point)'


def _rename_phase(old, new):
    op.get_bind().execute(
        sa.text(
            "UPDATE condition.report_submissions SET phase = :new WHERE phase = :old"
        ),
        {"old": old, "new": new},
    )


def upgrade():
    _rename_phase(OLD_PHASE, NEW_PHASE)


def downgrade():
    _rename_phase(NEW_PHASE, OLD_PHASE)
