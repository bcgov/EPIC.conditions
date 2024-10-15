import { Document } from "./Document";

export interface Project {
  project_id: string;
  project_name: string;
  documents?: Document[];    // Multiple documents per project
}
