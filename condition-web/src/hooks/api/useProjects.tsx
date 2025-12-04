import { AxiosError } from "axios";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
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
