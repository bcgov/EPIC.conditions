import { DocumentModel } from "./Document";

export interface ProjectModel {
  project_id: string;
  project_name: string;
  documents?: DocumentModel[];    // Multiple documents per project
}
