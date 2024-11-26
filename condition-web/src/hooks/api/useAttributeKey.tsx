import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions } from "./constants";

const fetchAttributes = (conditionId?: number) => {
  if (!conditionId) {
    return Promise.reject(new Error("Condition Number is required"));
  }

  return submitRequest({ url: `/attributekeys/condition/${conditionId}` });
};

export const useGetAttributes = (conditionId?: number) => {
  console.log(conditionId);
  return useQuery({
    queryKey: ["conditions", conditionId],
    queryFn: () => fetchAttributes(conditionId),
    enabled: Boolean(conditionId),
    retry: false,
    ...defaultUseQueryOptions,
  });
};
