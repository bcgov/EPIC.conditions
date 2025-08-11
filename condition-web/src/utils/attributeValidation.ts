import { IndependentAttributeModel } from "@/models/ConditionAttribute";
import {
  CONDITION_KEYS,
  consultationRequiredKeys,
  iemRequiredKeys,
  managementRequiredKeys,
} from "../components/ConditionDetails/ConditionAttribute/Constants";

export function extractRequirementFlags(attributes: IndependentAttributeModel[]) {
  const isConsultationRequired = attributes.some(
    (attr) => attr.key === CONDITION_KEYS.REQUIRES_CONSULTATION && attr.value === "true"
  );
  const isIEMRequired = attributes.some(
    (attr) => attr.key === CONDITION_KEYS.REQUIRES_IEM_TERMS_OF_ENGAGEMENT && attr.value === "true"
  );
  return { isConsultationRequired, isIEMRequired };
}

export function validateRequiredAttributes({
  attributes,
  isManagementRequired,
  isConsultationRequired,
  isIEMRequired,
}: {
  attributes: IndependentAttributeModel[];
  isManagementRequired: boolean;
  isConsultationRequired: boolean;
  isIEMRequired: boolean;
}): boolean {
  const getAttrValue = (key: string): string | undefined =>
    attributes.find((attr) => attr.key === key)?.value;

  type EmptyValue = unknown;

  const isEmpty = (value: EmptyValue): boolean => {
    if (value === null || value === undefined) return true;

    if (typeof value === "string") {
      return value.trim() === "";
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }

    return false;
  };

  const managementInvalid = isManagementRequired
    ? managementRequiredKeys.some((key) => isEmpty(getAttrValue(key)))
    : false;

  const consultationInvalid = isConsultationRequired
    ? consultationRequiredKeys.some((key) => isEmpty(getAttrValue(key)))
    : false;

  const iemInvalid = isIEMRequired
    ? iemRequiredKeys.some((key) => isEmpty(getAttrValue(key)))
    : false;

  return !(managementInvalid || consultationInvalid || iemInvalid);
}
