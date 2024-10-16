import { Condition } from "./Condition";

export interface Document {
  document_id: string;
  display_name: string;
  document_file_name: string;
  conditions?: Condition[];  // Multiple conditions per document
}
