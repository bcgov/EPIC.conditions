import { DocumentModel } from "./Document";

export interface ProjectModel {
  project_id: string;
  project_name: string;
  is_active?: boolean;
  documents: DocumentModel[];    // Multiple documents per project
}

export interface AvailableProjectModel {
  project_id: string;
  project_name: string;
}
