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

export interface IEMTermsModel {
  id: string;
  name: string;
  is_approved: boolean;
  attributes: IndependentAttributeModel[];
}

export interface ReportSubmissionModel {
  id: number;
  report_id: number;
  phase: string;
  frequency: string;
  timing: string;
  condition_subsection?: string;
  report_submission_type?: string;
  is_approved: boolean;
}

export interface ReportModel {
  id: number;
  condition_id: number;
  report_type: string;
  name?: string;
  linked_management_plan_id?: number;
  report_title?: string;
  submissions: ReportSubmissionModel[];
}

export interface ConditionAttributeModel {
  independent_attributes: IndependentAttributeModel[];
  management_plans: ManagementPlanModel[];
  iem_terms: IEMTermsModel[];
}
