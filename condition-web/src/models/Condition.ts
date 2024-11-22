import { SubconditionModel } from "./Subcondition";

export interface ConditionModel {
  condition_id: number;
  condition_name: string;
  condition_number: number;
  condition_text: string;
  amendment_names: string;
  year_issued: number;
  is_approved: boolean;
  topic_tags: string[];
  is_topic_tags_approved: boolean;
  subtopic_tags: string[];
  subconditions?: SubconditionModel[];   // Nested subconditions
  condition_attributes?: [{
    id: number;
    key: string;
    value: any;
  }];     // Associated deliverables
}

export const createDefaultCondition = (): ConditionModel => {
  return {
      condition_id: 0,
      condition_name: '',
      condition_number: 0,
      condition_text: '',
      amendment_names: '',
      year_issued: 0,
      is_approved: false,
      topic_tags: [],
      is_topic_tags_approved: false,
      subtopic_tags: [],
      subconditions: [],
      condition_attributes: [{
        id: 0,
        key: "",
        value: "",
      }],
  };
};

export interface updateTopicTagsModel {
  topic_tags?: string[];
  is_topic_tags_approved?: boolean;
  subconditions?: SubconditionModel[],
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
