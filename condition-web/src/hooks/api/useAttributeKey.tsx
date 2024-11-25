import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions } from "./constants";

const fetchAttributes = () => {
  return submitRequest({ url: "/attributes" });
};

export const useGetAttributes = () => {
  return useQuery({
    queryKey: ["attributes"],
    queryFn: fetchAttributes,
    retry: false,
    ...defaultUseQueryOptions,
  });
};
