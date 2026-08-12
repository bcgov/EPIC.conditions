"""migrate_iem_attributes_to_iem_terms

For conditions that already have "Requires IEM Terms of Engagement" = true, this migration:
  1. Creates an iem_terms record for the condition.
  2. Moves the IEM-related condition_attributes out of the management plan context
     (clears management_plan_id, sets iem_terms_id) when a management plan is present.
  3. Sets conditions.requires_iem_terms = TRUE.

Revision ID: a9b8c7d6e5f4
Revises: f3a4b5c6d7e8
Create Date: 2026-08-12 00:00:00.000000

"""
from alembic import op
from datetime import datetime
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'a9b8c7d6e5f4'
down_revision = 'f3a4b5c6d7e8'
branch_labels = None
depends_on = None

# Attribute key names whose rows belong inside an IEM Terms package.
IEM_ATTRIBUTE_KEY_NAMES = [
    'Requires consultation',
    'Parties required to be consulted',
    'Submitted to EAO for',
    'Time associated with submission milestone',
    'Milestone(s) related to plan submission',
    'Project phases(s) related to plan implementation',
]


def upgrade():
    conn = op.get_bind()

    # Find every condition that has "Requires IEM Terms of Engagement" = 'true',
    # regardless of whether it is under a management plan or not.
    signal_rows = conn.execute(text("""
        SELECT DISTINCT ca.condition_id, ca.management_plan_id
        FROM condition.condition_attributes ca
        JOIN condition.attribute_keys ak ON ca.attribute_key_id = ak.id
        WHERE ak.key_name = 'Requires IEM Terms of Engagement'
          AND LOWER(ca.attribute_value) = 'true'
          AND NOT EXISTS (
              SELECT 1 FROM condition.iem_terms it WHERE it.condition_id = ca.condition_id
          )
    """)).fetchall()

    if not signal_rows:
        return

    # Resolve IEM attribute key IDs once.
    iem_key_rows = conn.execute(text("""
        SELECT id FROM condition.attribute_keys
        WHERE key_name = ANY(:names)
    """), {"names": list(IEM_ATTRIBUTE_KEY_NAMES)}).fetchall()
    iem_key_ids = [row[0] for row in iem_key_rows]

    for condition_id, management_plan_id in signal_rows:
        # Create the iem_terms record.
        result = conn.execute(text("""
            INSERT INTO condition.iem_terms (condition_id, name, is_approved, created_date)
            VALUES (:condition_id, NULL, false, :created_date)
            RETURNING id
        """), {
            "condition_id": condition_id,
            "created_date": datetime.utcnow(),
        })
        iem_terms_id = result.fetchone()[0]

        # Mark the parent condition as requiring IEM terms.
        conn.execute(text("""
            UPDATE condition.conditions
            SET requires_iem_terms = TRUE
            WHERE id = :condition_id
        """), {"condition_id": condition_id})

        # Reassign IEM-related attributes to the new iem_terms record.
        if iem_key_ids:
            if management_plan_id is not None:
                conn.execute(text("""
                    UPDATE condition.condition_attributes
                    SET iem_terms_id       = :iem_terms_id,
                        management_plan_id = NULL
                    WHERE condition_id       = :condition_id
                      AND management_plan_id = :management_plan_id
                      AND attribute_key_id   = ANY(:iem_key_ids)
                """), {
                    "iem_terms_id": iem_terms_id,
                    "condition_id": condition_id,
                    "management_plan_id": management_plan_id,
                    "iem_key_ids": iem_key_ids,
                })
            else:
                conn.execute(text("""
                    UPDATE condition.condition_attributes
                    SET iem_terms_id = :iem_terms_id
                    WHERE condition_id      = :condition_id
                      AND management_plan_id IS NULL
                      AND iem_terms_id      IS NULL
                      AND attribute_key_id  = ANY(:iem_key_ids)
                """), {
                    "iem_terms_id": iem_terms_id,
                    "condition_id": condition_id,
                    "iem_key_ids": iem_key_ids,
                })


def downgrade():
    conn = op.get_bind()

    # Find all iem_terms records that were created by this migration
    # (name IS NULL is the marker we used on insert).
    iem_rows = conn.execute(text("""
        SELECT id, condition_id FROM condition.iem_terms
        WHERE name IS NULL
    """)).fetchall()

    for iem_terms_id, condition_id in iem_rows:
        # Find the management_plan for this condition that has the IEM signal attribute.
        plan_row = conn.execute(text("""
            SELECT DISTINCT ca.management_plan_id
            FROM condition.condition_attributes ca
            JOIN condition.attribute_keys ak ON ca.attribute_key_id = ak.id
            WHERE ca.condition_id  = :condition_id
              AND ak.key_name      = 'Requires IEM Terms of Engagement'
              AND LOWER(ca.attribute_value) = 'true'
              AND ca.management_plan_id IS NOT NULL
            LIMIT 1
        """), {"condition_id": condition_id}).fetchone()

        if plan_row:
            management_plan_id = plan_row[0]
            # Move attributes back under the management plan.
            conn.execute(text("""
                UPDATE condition.condition_attributes
                SET management_plan_id = :management_plan_id,
                    iem_terms_id       = NULL
                WHERE iem_terms_id = :iem_terms_id
            """), {
                "management_plan_id": management_plan_id,
                "iem_terms_id": iem_terms_id,
            })
        else:
            # No plan found — just detach the attributes so they become independent.
            conn.execute(text("""
                UPDATE condition.condition_attributes
                SET iem_terms_id = NULL
                WHERE iem_terms_id = :iem_terms_id
            """), {"iem_terms_id": iem_terms_id})

        # Delete the iem_terms record.
        conn.execute(text("""
            DELETE FROM condition.iem_terms WHERE id = :iem_terms_id
        """), {"iem_terms_id": iem_terms_id})

    # Clear requires_iem_terms on conditions that no longer have any iem_terms rows.
    conn.execute(text("""
        UPDATE condition.conditions c
        SET requires_iem_terms = NULL
        WHERE requires_iem_terms = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM condition.iem_terms it WHERE it.condition_id = c.id
          )
    """))
