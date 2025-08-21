import { SubconditionModel } from "./Subcondition";
import { ConditionAttributeModel } from "./ConditionAttribute";

export interface ConditionModel {
  condition_id?: number;
  condition_name?: string;
  condition_number?: number;
  condition_text?: string;
  amendment_names?: string;
  effective_document_id?: string;
  year_issued?: number;
  is_approved?: boolean;
  topic_tags?: string[];
  is_topic_tags_approved?: boolean;
  is_condition_attributes_approved?: boolean;
  is_standard_condition?: boolean;
  requires_management_plan?: boolean;
  source_document?: string;
  subtopic_tags?: string[];
  subconditions?: SubconditionModel[];   // Nested subconditions
  condition_attributes?: ConditionAttributeModel;
}

export const createDefaultCondition = (): ConditionModel => {
  return {
      condition_id: 0,
      condition_name: '',
      condition_number: 0,
      condition_text: '',
      amendment_names: '',
      effective_document_id: '',
      year_issued: 0,
      is_approved: false,
      topic_tags: [],
      is_topic_tags_approved: false,
      is_condition_attributes_approved: false,
      requires_management_plan: false,
      subtopic_tags: [],
      subconditions: [],
      condition_attributes: {
        independent_attributes: [],
        management_plans: [],
      },
  };
};

export interface updateTopicTagsModel {
  condition_number?: number;
  condition_name?: string;
  topic_tags?: string[];
  is_approved?: boolean;
  is_topic_tags_approved?: boolean;
  is_condition_attributes_approved?: boolean;
  subconditions?: SubconditionModel[],
}

export type PartialUpdateTopicTagsModel = Partial<updateTopicTagsModel>;

export interface ProjectDocumentConditionModel {
  project_name: string;
  document_category: string;
  document_category_id: number;
  document_label: string;
  conditions?: ConditionModel[];
}

export interface ProjectDocumentConditionDetailModel {
  project_id: string;
  project_name: string;
  document_category: string;
  document_category_id: number;
  document_id: string;
  document_label: string;
  condition: ConditionModel;
}

export type ConditionStatus = "true" | "false";
export const CONDITION_STATUS: Record<
  ConditionStatus,
  { value: ConditionStatus; label: string }
> = {
  true: {
    value: "true",
    label: "Approved",
  },
  false: {
    value: "false",
    label: "Awaiting Approval",
  }
};
