import { AxiosError } from "axios";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AvailableProjectModel } from "@/models/Project";
import { Options } from "./types";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const fetchProjects = async () => {
  try {
    return await submitRequest({ url: "/projects" });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw axiosError;
    }
    throw new Error("Something went wrong while fetching projects");
  }
};

export const useGetProjects = () => {
  return useQuery({
    queryKey: [QUERY_KEY.PROJECTS],
    queryFn: fetchProjects,
    ...defaultUseQueryOptions,
  });
};

const fetchAvailableProjects = async () => {
  return await submitRequest<AvailableProjectModel[]>({
    url: "/projects/available",
  });
};

export const useGetAvailableProjects = () => {
  return useQuery({
    queryKey: [QUERY_KEY.AVAILABLE_PROJECTS],
    queryFn: fetchAvailableProjects,
    ...defaultUseQueryOptions,
  });
};

const activateProject = (projectId: string) => {
  return submitRequest({
    url: `/projects/${projectId}/activate`,
    method: "PATCH",
  });
};

export const useActivateProject = (options?: Options) => {
  return useMutation({
    mutationFn: (projectId: string) => activateProject(projectId),
    ...options,
  });
};
