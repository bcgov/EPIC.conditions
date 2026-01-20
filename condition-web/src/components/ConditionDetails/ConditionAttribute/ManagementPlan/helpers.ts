import { IndependentAttributeModel, ManagementPlanModel } from "@/models/ConditionAttribute";

export const createDefaultAttributeRow = (key: string): IndependentAttributeModel => ({
  id: `temp-${key}-${Date.now()}`, // unique temp id per attribute
  key,
  value: "",
});

export const createDefaultManagementPlan = (
  id: string,
  requiredAttributeKeys: string[],
  optionalAttributeKeys: string[] = []
): ManagementPlanModel => {
  const allKeys = [...requiredAttributeKeys, ...optionalAttributeKeys];

  return {
    id,
    name: "",
    is_approved: false,
    attributes: allKeys.map(createDefaultAttributeRow),
  };
};
