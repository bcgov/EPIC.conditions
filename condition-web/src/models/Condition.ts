import { SubconditionModel } from "./Subcondition";
import { ConditionRequirementModel } from "./ConditionRequirement";

export interface ConditionModel {
  condition_name: string;
  condition_number: number;
  condition_text: string;
  topic_tags: string[];
  subtopic_tags: string[];
  subconditions?: SubconditionModel[];   // Nested subconditions
  condition_requirement?: ConditionRequirementModel[];     // Associated deliverables
}
