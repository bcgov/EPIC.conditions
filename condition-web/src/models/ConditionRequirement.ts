export interface ConditionRequirementModel {
  deliverable_name: string;
  is_plan: boolean;
  approval_type: string;
  stakeholders_to_consult: string[];
  stakeholders_to_submit_to: string[];
  consultation_required: boolean;
  related_phase: string;
  days_prior_to_commencement: number;
  is_approved: boolean;
}
