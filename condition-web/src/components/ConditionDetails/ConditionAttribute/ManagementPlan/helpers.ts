import { IndependentAttributeModel, ManagementPlanModel } from "@/models/ConditionAttribute";

export const createDefaultAttributeRow = (key: string): IndependentAttributeModel => ({
  id: `temp-${key}-${Date.now()}`, // unique temp id per attribute
  key,
  value: "",
});

export const createDefaultManagementPlan = (
    id: string,
    attributeKeys: string[]
): ManagementPlanModel => ({
    id,
    name: "",
    is_approved: false,
    attributes: attributeKeys.map(createDefaultAttributeRow),
});
