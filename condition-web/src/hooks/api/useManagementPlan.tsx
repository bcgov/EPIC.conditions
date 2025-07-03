import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

export const usePatchManagementPlan = (
    planId?: string,
    options?: Options
  ) => {
    return useMutation({
      mutationFn: (payload: Partial<{ name: string; is_approved: boolean }>) => {
        if (!planId) {
          return Promise.reject(new Error("Management Plan ID is required"));
        }
        return submitRequest({
          url: `/managementplan/${planId}`,
          method: "patch",
          data: payload,
        });
      },
      ...options,
    });
  };

const removeManagementPlan = (planId: string) => {
  return submitRequest({
    url: `/managementplan/${planId}`,
    method: "delete",
  });
};

export const useRemoveManagementPlan = (options?: Options) => {
  return useMutation({
    mutationFn: (planId: string) => {
      if (!planId) {
        return Promise.reject(new Error("Plan ID is required"));
      }
      return removeManagementPlan(planId);
    },
    ...options,
  });
};
