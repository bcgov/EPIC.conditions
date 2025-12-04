export interface IndependentAttributeModel {
  id: string;
  key: string;
  value: string;
}

export interface ManagementPlanModel {
  id: string;
  name: string;
  is_approved: boolean;
  attributes: IndependentAttributeModel[];
}

export interface ConditionAttributeModel {
  independent_attributes: IndependentAttributeModel[];
  management_plans: ManagementPlanModel[];
}
