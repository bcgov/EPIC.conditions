export interface Subcondition {
    subcondition_id: string;
    subcondition_identifier: string;
    subcondition_text: string;
    subconditions?: Subcondition[];  // Recursive type for nested subconditions
  }
