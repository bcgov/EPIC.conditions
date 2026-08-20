import { IndependentAttributeModel, IEMTermsModel } from "@/models/ConditionAttribute";

export const createDefaultAttributeRow = (key: string): IndependentAttributeModel => ({
  id: `temp-${key}-${Date.now()}`,
  key,
  value: "",
});

export const createDefaultIEMTerms = (
  id: string,
  requiredAttributeKeys: string[],
  optionalAttributeKeys: string[] = []
): IEMTermsModel => {
  const allKeys = [...requiredAttributeKeys, ...optionalAttributeKeys];

  return {
    id,
    name: "",
    is_approved: false,
    attributes: allKeys.map(createDefaultAttributeRow),
  };
};
