"""Service for condition management."""
from condition_api.exceptions import ResourceNotFoundError
from condition_api.models.subcondition import Subcondition
from condition_api.models.db import db

class SubConditionService:
    """Service for managing subcondition-related operations."""

    @staticmethod
    def update_subconditions(subconditions_data: list):
        """Update multiple subconditions based on the provided list of data."""
        updated_subconditions = []
        # Loop through each subcondition data in the payload
        for subcondition_data in subconditions_data:
            subcondition_id = subcondition_data.get("subcondition_id")
            new_identifier = subcondition_data.get("subcondition_identifier")
            new_text = subcondition_data.get("subcondition_text")
            
            # Query the subcondition by id
            subcondition = db.session.query(Subcondition).filter_by(id=subcondition_id).one_or_none()
            
            if not subcondition:
                raise ResourceNotFoundError("Subcondition with id {subcondition_id} not found.")

            subcondition.subcondition_identifier = new_identifier
            subcondition.subcondition_text = new_text
            updated_subconditions.append(subcondition)
        
        # Commit changes to the database
        db.session.commit()
        return updated_subconditions  # Return list of updated subconditions
