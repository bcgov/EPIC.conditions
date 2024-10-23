import { ProjectDocumentConditionModel } from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";

const loadConditions = (projectId?: string, documentId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<ProjectDocumentConditionModel>({
    url: `/conditions/project/${projectId}/document/${documentId}`,
  });
};

export const useLoadConditions = (projectId?: string, documentId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId],
    queryFn: () => loadConditions(projectId, documentId),
    enabled: Boolean(projectId && documentId),
    retry: false,
  });
};
