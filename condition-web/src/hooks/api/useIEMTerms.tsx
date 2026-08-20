import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

export const usePatchIEMTerms = (
  termsId?: string,
  options?: Options
) => {
  return useMutation({
    mutationFn: (payload: Partial<{ name: string; is_approved: boolean }>) => {
      if (!termsId) {
        return Promise.reject(new Error("IEM Terms ID is required"));
      }
      return submitRequest({
        url: `/iemterms/${termsId}`,
        method: "patch",
        data: payload,
      });
    },
    ...options,
  });
};

const removeIEMTerms = (termsId: string) => {
  return submitRequest({
    url: `/iemterms/${termsId}`,
    method: "delete",
  });
};

export const useRemoveIEMTerms = (options?: Options) => {
  return useMutation({
    mutationFn: (termsId: string) => {
      if (!termsId) {
        return Promise.reject(new Error("IEM Terms ID is required"));
      }
      return removeIEMTerms(termsId);
    },
    ...options,
  });
};
