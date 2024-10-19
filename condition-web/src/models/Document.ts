import { ConditionModel } from "./Condition";

export interface DocumentModel {
  document_id: string;
  display_name: string;
  document_file_name: string;
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
