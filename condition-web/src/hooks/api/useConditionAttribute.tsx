import { ConditionAttributeModel } from "@/models/ConditionAttribute";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

type UpdateConditionAttributePayload = {
  requires_management_plan?: boolean;
  requires_iem_terms?: boolean;
  condition_attribute: ConditionAttributeModel;
};

const updateConditionAttributeDetails = (
  conditionId: number,
  payload: UpdateConditionAttributePayload
) => {
  return submitRequest({
    url: `/attributes/condition/${conditionId}`,
    method: "patch",
    data: payload,
  });
};

export const useUpdateConditionAttributeDetails = (
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (payload: UpdateConditionAttributePayload) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateConditionAttributeDetails(conditionId, payload);
    },
    ...options,
  });
};

const deleteSingleConditionAttribute = (conditionId: number, attributeId: number) => {
  return submitRequest({
    url: `/attributes/condition/${conditionId}/attribute/${attributeId}`,
    method: "delete",
  });
};

export const useDeleteSingleConditionAttribute = (
  conditionId?: number,
  options?: Options
) => {
  return useMutation({
    mutationFn: (attributeId: number) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return deleteSingleConditionAttribute(conditionId, attributeId);
    },
    ...options,
  });
};

const removeConditionAttributes = (
  conditionId: number,
  requiresManagementPlan: boolean
) => {
  const param = `requires_management_plan=${requiresManagementPlan}`;
  return submitRequest({
    url: `/attributes/condition/${conditionId}?${param}`,
    method: "delete",
    data: { requires_management_plan: requiresManagementPlan },
  });
};

export const useRemoveConditionAttributes = (
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (requiresPlan: boolean) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return removeConditionAttributes(conditionId, requiresPlan);
    },
    ...options,
  });
};
