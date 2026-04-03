import sys
import os

# Add the src directory to the module search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from condition_api import create_app
from condition_api.models.db import db
from condition_api.models.extraction_request import ExtractionRequest
from condition_api.models.project import Project
import random

def seed_data():
    app = create_app()
    with app.app_context():
        # Retrieve the first active project available to use as a seed context
        project = db.session.query(Project).filter_by(is_active=True).first()
        
        if not project:
            print("⚠️ No active projects found. Creating a Mock Project 'PROJ-TEST-101'...")
            project = Project(
                project_id="PROJ-TEST-101",
                project_name="Demo AI Extraction Project",
                project_type="Mine",
                is_active=True
            )
            db.session.add(project)
            db.session.commit()

        mock_document_id = f"DOC-TEST-{random.randint(1000, 9999)}"
        
        # This mirrors the extraction payload strictly outputted by the background AI process.
        extracted_data_payload = {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "document_id": mock_document_id,
            "document_type": "Certificate",
            "display_name": "Schedule B - AI Mock Extraction",
            "date_issued": "2024-04-03",
            "act": 2018,
            "conditions": [
                {
                    "condition_name": "Site Management",
                    "condition_number": 1,
                    "condition_text": "The Proponent must retain a qualified professional to monitor site drainage.",
                    "topic_tags": ["Water Quality", "Monitoring"],
                    "effective_from": "2024-04-03T00:00:00Z",
                    "effective_to": None,
                    "clauses": [
                        {
                            "clause_identifier": "1.1",
                            "clause_text": "The drainage must not exceed background levels.",
                            "subconditions": []
                        }
                    ],
                    "deliverables": [
                        {
                           "is_plan": True,
                           "deliverable_name": "Water Management Plan",
                           "fn_consultation_required": True,
                           "implementation_phase": "Construction"
                        }
                    ]
                },
                {
                    "condition_name": "Wildlife Protection",
                    "condition_number": 2,
                    "condition_text": "Construction activities must be restricted during the migratory bird nesting season.",
                    "topic_tags": ["Wildlife"],
                    "clauses": []
                }
            ]
        }

        # Create a new Extraction Request mimicking the state *after* the cron job processed it successfully.
        req = ExtractionRequest(
            project_id=project.project_id,
            document_id=mock_document_id,
            document_type_id=1,  # Arbitrary generic document type ID
            document_label="Schedule B - AI Mock Extraction",
            s3_url=f"conditions/{mock_document_id}-mock.pdf",
            status="completed",
            extracted_data=extracted_data_payload
        )
        
        db.session.add(req)
        db.session.commit()
        
        print(f"✅ Successfully seeded mock extraction request ID {req.id}")
        print("Navigate to the Extracted Documents dashboard in the frontend to preview it!")

if __name__ == "__main__":
    seed_data()
