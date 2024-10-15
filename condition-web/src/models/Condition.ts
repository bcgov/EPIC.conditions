import { Subcondition } from "./Subcondition";
import { ConditionRequirement } from "./ConditionRequirement";

export interface Condition {
  condition_name: string;
  condition_number: number;
  condition_text: string;
  topic_tags: string[];
  subtopic_tags: string[];
  subconditions?: Subcondition[];   // Nested subconditions
  condition_requirement?: ConditionRequirement[];     // Associated deliverables
}
