# Copyright © 2019 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Test Utils.

Test Utility for creating model factory.
"""
import uuid
from datetime import datetime

from condition_api.config import get_named_config
from condition_api.models import (
    Amendment, Condition, Document, DocumentCategory, DocumentType, Project, db
)

from sqlalchemy import func


CONFIG = get_named_config("testing")

CONFIG = get_named_config("testing")

JWT_HEADER = {
    "alg": CONFIG.JWT_OIDC_TEST_ALGORITHMS,
    "typ": "JWT",
    "kid": CONFIG.JWT_OIDC_TEST_AUDIENCE,
}


def factory_auth_header(jwt, claims):
    """Produce JWT tokens for use in tests."""
    return {
        "Authorization": "Bearer " + jwt.create_jwt(claims=claims, header=JWT_HEADER)
    }


def factory_project_model(
    project_id="58851056aaecd9001b80ebf8",
    project_name="Tulsequah Chief Mine",
    project_type="Mines"
):
    """Factory for Project model."""
    project = Project(
        project_id=project_id,
        project_name=project_name,
        project_type=project_type
    )
    db.session.add(project)
    db.session.commit()
    return project


def factory_document_category_model(name="Environmental Reports"):
    """Document Category"""
    existing = DocumentCategory.query.filter_by(category_name=name).first()
    if existing:
        return existing

    category = DocumentCategory(category_name=name)
    db.session.add(category)
    db.session.commit()
    return category


def factory_document_type_model(category, name="Impact Report"):
    """Document Type"""
    doc_type = DocumentType(document_type=name, document_category_id=category.id)
    db.session.add(doc_type)
    db.session.commit()
    return doc_type


def factory_document_model(project, doc_type, is_latest=True):
    """Document"""
    document = Document(
        document_id=str(uuid.uuid4()),
        project_id=project.project_id,
        document_type_id=doc_type.id,
        document_label="Label A",
        document_file_name="test.pdf",
        is_latest_amendment_added=is_latest,
        date_issued=datetime.utcnow(),
        consultation_records_required=True
    )
    db.session.add(document)
    db.session.commit()
    return document


def factory_condition_model(document_id, project_id, is_approved=True):
    """Factory for Condition model."""
    condition = Condition(
        document_id=document_id,
        project_id=project_id,
        condition_name="Cond A",
        condition_number="001",
        is_approved=is_approved,
        is_condition_attributes_approved=is_approved,
        is_topic_tags_approved=is_approved
    )
    db.session.add(condition)
    db.session.commit()
    return condition


def factory_amendment_model(document):
    """Amendment"""
    amendment = Amendment(
        document_id=document.id,
        amended_document_id=str(uuid.uuid4()),
        document_type_id=document.document_type_id,
        date_issued=datetime.utcnow()
    )
    db.session.add(amendment)
    db.session.commit()
    return amendment


def get_seeded_document_category(name="Certificate and Amendments"):
    """Seeded Document Category"""
    from condition_api.models import DocumentCategory
    from sqlalchemy import func

    return DocumentCategory.query.filter(
        func.lower(DocumentCategory.category_name) == name.lower()
    ).first()


def get_seeded_document_type(type_name="Certificate"):
    """Seeded Document Type"""
    return (
        DocumentType.query
        .filter(func.lower(DocumentType.document_type) == type_name.lower())
        .first()
    )
