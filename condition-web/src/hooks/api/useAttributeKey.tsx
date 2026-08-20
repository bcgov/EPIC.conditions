import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";
import { AttributeKeyModel } from "@/models/AttributeKey";

const fetchAttributes = (conditionId?: number, managementPlanId?: number, iemTermsId?: number) => {
  if (!conditionId) {
    return Promise.reject(new Error("Condition Number is required"));
  }

  const params = new URLSearchParams();
  if (managementPlanId) params.set("management_plan_id", String(managementPlanId));
  if (iemTermsId) params.set("iem_terms_id", String(iemTermsId));
  const queryParams = params.toString() ? `?${params.toString()}` : "";

  return submitRequest<AttributeKeyModel[]>({
    url: `/attributekeys/condition/${conditionId}${queryParams}`,
  });
};

export const useGetAttributes = (
  conditionId?: number,
  managementPlanId?: number,
  iemTermsId?: number,
) => {
  return useQuery({
    queryKey: [QUERY_KEY.ATTRIBUTEKEYS, conditionId, managementPlanId, iemTermsId],
    queryFn: () => fetchAttributes(conditionId, managementPlanId, iemTermsId),
    enabled: Boolean(conditionId),
    ...defaultUseQueryOptions,
  });
};
