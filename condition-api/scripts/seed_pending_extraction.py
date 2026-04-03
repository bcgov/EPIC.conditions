import sys, os, random
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from condition_api import create_app
from condition_api.models.db import db
from condition_api.models.extraction_request import ExtractionRequest
from condition_api.models.project import Project

def seed_data():
    app = create_app()
    with app.app_context():
        project = db.session.query(Project).filter_by(is_active=True).first()
        mock_document_id = f"DOC-TEST-PEND-{random.randint(1000, 9999)}"
        req = ExtractionRequest(
            project_id=project.project_id,
            document_id=mock_document_id,
            document_label="CaribooGold_ScheduleB_TableofConditions.pdf",
            s3_url=f"conditions/{mock_document_id}-mock.pdf",
            status="pending",
        )
        db.session.add(req)
        db.session.commit()
if __name__ == "__main__":
    seed_data()
