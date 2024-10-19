import { ProjectModel } from "@/models/Project";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";

const loadProjectsByProjectId = (projectId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<ProjectModel[]>({
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

const fetchProjects = () => {
  return submitRequest({ url: "/projects" });
};

export const useGetProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
};
