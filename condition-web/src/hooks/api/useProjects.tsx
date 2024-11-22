import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions } from "./constants";

const fetchProjects = () => {
  return submitRequest({ url: "/projects" });
};

export const useGetProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    retry: false,
    ...defaultUseQueryOptions,
  });
};
