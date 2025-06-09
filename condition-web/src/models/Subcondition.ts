export interface SubconditionModel {
    subcondition_id: string;
    subcondition_identifier: string;
    subcondition_text: string;
    sort_order: number;
    subconditions?: SubconditionModel[];  // Recursive type for nested subconditions
  }
