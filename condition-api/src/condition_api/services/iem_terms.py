"""Service for IEM Terms of Engagement management."""
from marshmallow import ValidationError

from condition_api.models.db import db
from condition_api.models.condition import Condition
from condition_api.models.iem_terms import IEMTerms


class IEMTermsService:
    """Service for managing IEM Terms of Engagement related operations."""

    @staticmethod
    def update_iem_terms(terms_id, payload):
        """Update an IEM Terms package name or approval status."""
        terms = IEMTerms.find_by_id(terms_id)
        if not terms:
            raise ValueError("IEM Terms not found for the given ID.")

        if "name" in payload:
            name = payload["name"]
            if not isinstance(name, str) or not name.strip():
                raise ValidationError("IEM Terms name cannot be blank.")
            terms.name = name.strip()

        if "is_approved" in payload:
            terms.is_approved = payload["is_approved"]

            condition = Condition.query.get(terms.condition_id)
            all_terms = IEMTerms.query.filter_by(condition_id=terms.condition_id).all()
            all_approved = all(t.is_approved for t in all_terms)
            if condition:
                condition.is_condition_attributes_approved = all_approved

        db.session.commit()
        return terms
