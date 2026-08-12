# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Service for condition attribute management."""
from condition_api.models.attribute_key import AttributeKey
from condition_api.models.condition import Condition
from condition_api.models.condition_attribute import ConditionAttribute
from condition_api.models.db import db
from condition_api.models.iem_terms import IEMTerms
from condition_api.models.management_plan import ManagementPlan
from condition_api.utils.enums import AttributeKeys, IEMTermsConfig, ManagementPlanConfig


class AttributeKeyNotFoundError(Exception):
    """Custom exception for missing attribute key."""

    def __init__(self, key_name):
        """Init"""
        super().__init__(f"Attribute key '{key_name}' does not exist.")
        self.key_name = key_name


class ConditionAttributeService:
    """Service for managing condition-attribute related operations."""

    @staticmethod
    def upsert_condition_attribute(requires_management_plan, condition_id, attributes,
                                   requires_iem_terms=False):
        """
        Updates or inserts condition attributes for a given condition.

        :param requires_management_plan: Boolean flag for management plans.
        :param condition_id: ID of the condition.
        :param attributes: Dict with 'independent_attributes', 'management_plans', and/or 'iem_terms'.
        :param requires_iem_terms: Boolean flag for IEM Terms of Engagement.
        :return: Dict with all attribute types.
        """
        condition = db.session.query(Condition).filter_by(id=condition_id).first()
        if condition:
            condition.requires_management_plan = requires_management_plan
            if requires_iem_terms:
                condition.requires_iem_terms = True

        if requires_management_plan:
            management_plans = attributes.get("management_plans", [])
            for plan in management_plans:
                plan_id = plan.get("id")
                plan_name = plan.get("name")

                if plan_id and "-" not in str(plan_id):
                    existing_plan = db.session.query(ManagementPlan).filter_by(id=plan_id).first()
                else:
                    existing_plan = None

                if existing_plan:
                    existing_plan.name = plan_name
                else:
                    existing_plan = ManagementPlan(condition_id=condition_id, name=plan_name)
                    db.session.add(existing_plan)
                    db.session.flush()

                for attr in plan.get("attributes", []):
                    ConditionAttributeService._upsert_single_attribute(
                        condition_id=condition_id,
                        attribute_data=attr,
                        management_plan_id=existing_plan.id
                    )

                ConditionAttributeService._handle_requires_management_plan(
                    condition_id, existing_plan.id
                )

        if requires_iem_terms:
            iem_terms_list = attributes.get("iem_terms", [])
            for terms in iem_terms_list:
                terms_id = terms.get("id")
                terms_name = terms.get("name")

                if terms_id and "-" not in str(terms_id):
                    existing_terms = db.session.query(IEMTerms).filter_by(id=terms_id).first()
                else:
                    existing_terms = None

                if existing_terms:
                    existing_terms.name = terms_name
                else:
                    existing_terms = IEMTerms(condition_id=condition_id, name=terms_name)
                    db.session.add(existing_terms)
                    db.session.flush()

                for attr in terms.get("attributes", []):
                    ConditionAttributeService._upsert_single_attribute(
                        condition_id=condition_id,
                        attribute_data=attr,
                        iem_terms_id=existing_terms.id
                    )

                ConditionAttributeService._handle_requires_iem_terms_package(
                    condition_id, existing_terms.id
                )

        if not requires_management_plan and not requires_iem_terms:
            independent_attrs = attributes.get("independent_attributes", [])
            for attribute in independent_attrs:
                ConditionAttributeService._upsert_single_attribute(
                    condition_id=condition_id,
                    attribute_data=attribute
                )

        db.session.commit()

        return ConditionAttributeService._fetch_all_attributes(condition_id)

    @staticmethod
    def _upsert_single_attribute(condition_id, attribute_data, management_plan_id=None,
                                  iem_terms_id=None):
        """Update or insert a single attribute."""
        attribute_id = attribute_data.get("id")
        key_name = attribute_data.get("key")
        value = attribute_data.get("value")

        key = db.session.query(AttributeKey).filter_by(key_name=key_name).first()
        if not key:
            raise AttributeKeyNotFoundError(key_name)

        existing_attribute = db.session.query(ConditionAttribute).filter_by(
            condition_id=condition_id,
            attribute_key_id=key.id,
            management_plan_id=management_plan_id,
            iem_terms_id=iem_terms_id,
        ).first()

        if not existing_attribute and attribute_id and "-" not in str(attribute_id):
            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                id=attribute_id
            ).first()

        if existing_attribute:
            existing_attribute.attribute_value = value
        else:
            if key.key_name == AttributeKeys.DELIVERABLE_NAME.value:
                return

            attribute = ConditionAttribute(
                condition_id=condition_id,
                attribute_key_id=key.id,
                attribute_value=value,
                management_plan_id=management_plan_id,
                iem_terms_id=iem_terms_id,
            )
            db.session.add(attribute)
            db.session.flush()

        if key.key_name == AttributeKeys.REQUIRES_CONSULTATION.value and value == 'true':
            ConditionAttributeService._handle_requires_consultation(
                condition_id, management_plan_id, iem_terms_id
            )

        if key.key_name == AttributeKeys.REQUIRES_IEM_TERMS_OF_ENGAGEMENT.value and value == 'true':
            ConditionAttributeService._handle_requires_iem_terms_of_engagement(
                condition_id, value, management_plan_id
            )

    @staticmethod
    def _handle_requires_consultation(condition_id, management_plan_id, iem_terms_id=None):
        """
        Handles additional attributes when REQUIRES_CONSULTATION is set to true.
        """
        consultation_key = db.session.query(AttributeKey).filter(
            AttributeKey.key_name == AttributeKeys.PARTIES_REQUIRED_TO_BE_CONSULTED.value
        ).first()

        existing_attribute = db.session.query(ConditionAttribute).filter_by(
            condition_id=condition_id,
            attribute_key_id=consultation_key.id,
            management_plan_id=management_plan_id,
            iem_terms_id=iem_terms_id,
        ).first()

        if not existing_attribute:
            new_attribute = ConditionAttribute(
                condition_id=condition_id,
                attribute_key_id=consultation_key.id,
                attribute_value='{}',
                management_plan_id=management_plan_id,
                iem_terms_id=iem_terms_id,
            )
            db.session.add(new_attribute)
            db.session.flush()

    @staticmethod
    def _handle_requires_iem_terms_of_engagement(condition_id, attribute_value, management_plan_id):
        """
        Handles additional attributes when REQUIRES_IEM_TERMS_OF_ENGAGEMENT is set to true
        within a management plan attribute.
        """
        deliverable_key_name = AttributeKeys.DELIVERABLE_NAME.value
        deliverable_value = IEMTermsConfig.DELIVERABLE_VALUE
        required_keys = IEMTermsConfig.required_attribute_keys()

        if attribute_value != 'true':
            deliverable_key = db.session.query(AttributeKey).filter(
                AttributeKey.key_name == deliverable_key_name
            ).first()
            if deliverable_key:
                db.session.query(ConditionAttribute).filter_by(
                    condition_id=condition_id,
                    attribute_key_id=deliverable_key.id
                ).delete()
            db.session.commit()
            return

        keys = db.session.query(AttributeKey).filter(AttributeKey.key_name.in_(required_keys)).all()
        for key in keys:
            existing = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id, attribute_key_id=key.id
            ).first()

            if not existing:
                attribute_value = deliverable_value if key.key_name == deliverable_key_name else None
                new_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=key.id,
                    attribute_value=attribute_value,
                    management_plan_id=management_plan_id
                )
                db.session.add(new_attribute)
                db.session.flush()
            else:
                if key.key_name == deliverable_key_name:
                    current_value = existing.attribute_value or ""
                    values = current_value.strip('{}').split(',') if current_value else []
                    values = [v.strip() for v in values if v.strip()]

                    if deliverable_value not in values:
                        values.append(deliverable_value)
                        updated_value = "{" + ",".join(values) + "}"
                        existing.attribute_value = updated_value
                        db.session.flush()

    @staticmethod
    def _handle_requires_management_plan(condition_id, management_plan_id):
        """
        Creates required attributes for a new management plan package.
        """
        required_keys = ManagementPlanConfig.required_attribute_keys()

        all_attribute_keys = db.session.query(AttributeKey).filter(
            AttributeKey.key_name.in_(required_keys)
        ).all()
        for key in all_attribute_keys:
            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id,
                attribute_key_id=key.id,
                management_plan_id=management_plan_id,
            ).first()

            if not existing_attribute:
                new_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=key.id,
                    attribute_value=None,
                    management_plan_id=management_plan_id
                )
                db.session.add(new_attribute)
                db.session.flush()

    @staticmethod
    def _handle_requires_iem_terms_package(condition_id, iem_terms_id):
        """
        Creates required attributes for a new IEM Terms of Engagement package.
        """
        required_keys = IEMTermsConfig.required_attribute_keys()

        all_attribute_keys = db.session.query(AttributeKey).filter(
            AttributeKey.key_name.in_(required_keys)
        ).all()
        for key in all_attribute_keys:
            existing_attribute = db.session.query(ConditionAttribute).filter_by(
                condition_id=condition_id,
                attribute_key_id=key.id,
                iem_terms_id=iem_terms_id,
            ).first()

            if not existing_attribute:
                new_attribute = ConditionAttribute(
                    condition_id=condition_id,
                    attribute_key_id=key.id,
                    attribute_value=None,
                    iem_terms_id=iem_terms_id
                )
                db.session.add(new_attribute)
                db.session.flush()

    @staticmethod
    def _fetch_all_attributes(condition_id):
        """Fetch and format all attribute types for a condition."""
        excluded_key_names = {AttributeKeys.PARTIES_REQUIRED_TO_BE_SUBMITTED.value}

        # Fetch management plans
        management_plans = []
        plans = db.session.query(ManagementPlan).filter_by(condition_id=condition_id).all()
        for plan in plans:
            plan_attrs = (
                db.session.query(ConditionAttribute, AttributeKey)
                .join(AttributeKey)
                .filter(
                    ConditionAttribute.condition_id == condition_id,
                    ConditionAttribute.management_plan_id == plan.id,
                    ~AttributeKey.key_name.in_(excluded_key_names)
                )
                .order_by(AttributeKey.sort_order)
                .all()
            )
            management_plans.append({
                "id": plan.id,
                "name": plan.name,
                "is_approved": plan.is_approved,
                "attributes": [
                    {"id": attr.id, "key": key.key_name, "value": attr.attribute_value}
                    for attr, key in plan_attrs
                ]
            })

        # Fetch IEM terms
        iem_terms_result = []
        all_iem_terms = db.session.query(IEMTerms).filter_by(condition_id=condition_id).all()
        for terms in all_iem_terms:
            terms_attrs = (
                db.session.query(ConditionAttribute, AttributeKey)
                .join(AttributeKey)
                .filter(
                    ConditionAttribute.condition_id == condition_id,
                    ConditionAttribute.iem_terms_id == terms.id,
                    ~AttributeKey.key_name.in_(excluded_key_names)
                )
                .order_by(AttributeKey.sort_order)
                .all()
            )
            iem_terms_result.append({
                "id": terms.id,
                "name": terms.name,
                "is_approved": terms.is_approved,
                "attributes": [
                    {"id": attr.id, "key": key.key_name, "value": attr.attribute_value}
                    for attr, key in terms_attrs
                ]
            })

        # Fetch independent attributes (no management_plan_id and no iem_terms_id)
        independent_attrs = (
            db.session.query(ConditionAttribute, AttributeKey)
            .join(AttributeKey, ConditionAttribute.attribute_key_id == AttributeKey.id)
            .filter(
                ConditionAttribute.condition_id == condition_id,
                ConditionAttribute.management_plan_id.is_(None),
                ConditionAttribute.iem_terms_id.is_(None),
                ~AttributeKey.key_name.in_(excluded_key_names),
            )
            .order_by(AttributeKey.sort_order)
            .all()
        )

        independent_attributes = [
            {"id": attr.id, "key": key.key_name, "value": attr.attribute_value}
            for attr, key in independent_attrs
        ]

        return {
            "independent_attributes": independent_attributes,
            "management_plans": management_plans,
            "iem_terms": iem_terms_result,
        }

    @staticmethod
    def delete_single_condition_attribute(condition_id, attribute_id):
        """Delete a single condition attribute by ID."""
        attribute = db.session.query(ConditionAttribute).filter_by(
            id=attribute_id,
            condition_id=condition_id
        ).first()

        if not attribute:
            return False

        db.session.delete(attribute)
        db.session.commit()
        return True

    @staticmethod
    def delete_condition_attribute(condition_id, requires_management_plan=None):
        """Remove condition attribute and management plan data, and update condition flag if provided."""
        if requires_management_plan is not None:
            condition = db.session.query(Condition).filter_by(id=condition_id).first()
            if condition:
                condition.requires_management_plan = requires_management_plan

        plan_query = db.session.query(ManagementPlan).filter(
            ManagementPlan.condition_id == condition_id
        )
        if plan_query.count() > 0:
            plan_query.delete()

        attr_query = db.session.query(ConditionAttribute).filter(
            ConditionAttribute.condition_id == condition_id
        )
        if attr_query.count() == 0:
            db.session.commit()
            return False

        attr_query.delete()
        db.session.commit()
        return True
