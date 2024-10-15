import { Project } from "@/models/Project";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";

const loadProjectsByProjectId = (projectId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<Project[]>({
    url: `/projects/${projectId}`,
  });
};

export const useLoadProjectsByProjectId = (projectId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => loadProjectsByProjectId(projectId),
    enabled: Boolean(projectId),
    retry: false,
  });
};
