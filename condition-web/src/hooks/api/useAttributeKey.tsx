import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { AttributeKeyModel } from "@/models/AttributeKey";

const fetchAttributes = (conditionId?: number, managementPlanId?: number) => {
  if (!conditionId) {
    return Promise.reject(new Error("Condition Number is required"));
  }

  const queryParams = managementPlanId ? `?management_plan_id=${managementPlanId}` : "";

  return submitRequest<AttributeKeyModel[]>({
    url: `/attributekeys/condition/${conditionId}${queryParams}`,
  });
};

export const useGetAttributes = (
  conditionId?: number,
  managementPlanId?: number
) => {
  return useQuery({
    queryKey: [QUERY_KEY.ATTRIBUTEKEYS, conditionId, managementPlanId],
    queryFn: () => fetchAttributes(conditionId, managementPlanId),
    enabled: Boolean(conditionId),
    ...defaultUseQueryOptions,
  });
};
