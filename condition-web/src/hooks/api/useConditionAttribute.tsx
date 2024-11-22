import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

const updateConditionAttributeDetails = (
  conditionId: number,
  conditionAttributeDetails: ConditionAttributeModel[]
) => {
  return submitRequest({
    url: `/attributes/condition/${conditionId}`,
    method: "patch",
    data: conditionAttributeDetails,
  });
};

export const useUpdateConditionAttributeDetails = (
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionAttributeDetails: ConditionAttributeModel[]) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateConditionAttributeDetails(conditionId, conditionAttributeDetails);
    },
    ...options,
  });
};
