import {
  ProjectDocumentConditionModel,
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";

const loadConsolidatedConditions = (projectId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<ProjectDocumentConditionModel>({
    url: `/conditions/project/${projectId}`,
  });
};

export const useConsolidatedConditions = (
  projectId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => loadConsolidatedConditions(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });
};
