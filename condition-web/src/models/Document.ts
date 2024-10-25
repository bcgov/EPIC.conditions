import { ConditionModel } from "./Condition";

export interface DocumentModel {
  document_id: string;
  display_name: string;
  document_file_name: string;
  project_id: string;
  document_type: string;
  date_issued: string;
  act: string;
  status: string;
  conditions?: ConditionModel[];  // Multiple conditions per document
}

export type DocumentStatus = "true" | "false";
export const DOCUMENT_STATUS: Record<
  DocumentStatus,
  { value: DocumentStatus; label: string }
> = {
  true: {
    value: "true",
    label: "Approved",
  },
  false: {
    value: "false",
    label: "Pending",
  },
};

export interface AllDocumentModel {
  document_id: string;
  document_name: string;
  year_issued: string;
  status: boolean;
}

export interface ProjectDocumentAllAmendmentsModel {
  project_name: string;
  document_type: string;
  amendments?: AllDocumentModel[];
}
