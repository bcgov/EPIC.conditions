import { SubconditionModel } from "./Subcondition";
import { ConditionRequirementModel } from "./ConditionRequirement";

export interface ConditionModel {
  condition_name: string;
  condition_number: number;
  condition_text: string;
  amendment_names: string;
  year_issued: number;
  is_approved: boolean;
  topic_tags: string[];
  subtopic_tags: string[];
  subconditions?: SubconditionModel[];   // Nested subconditions
  condition_requirement?: ConditionRequirementModel[];     // Associated deliverables
}

export interface ProjectDocumentConditionModel {
  project_name: string;
  document_type: string;
  conditions?: ConditionModel[];
}

export interface ProjectDocumentConditionDetailModel {
  project_name: string;
  document_type: string;
  display_name: string;
  condition: ConditionModel;
}
