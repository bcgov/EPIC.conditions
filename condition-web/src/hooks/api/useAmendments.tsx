import { ProjectDocumentAllAmendmentsModel } from "@/models/Document";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";

const loadAmendments = (projectId?: string, documentId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<ProjectDocumentAllAmendmentsModel>({
    url: `/amendments/project/${projectId}/document/${documentId}`,
  });
};

export const useLoadAmendments = (projectId?: string, documentId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId],
    queryFn: () => loadAmendments(projectId, documentId),
    enabled: Boolean(projectId && documentId),
    retry: false,
  });
};
