import { CreateAmendmentModel } from "@/models/Amendment";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";

const createAmendment = (
  documentId: string,
  amendmentDetails: CreateAmendmentModel
) => {
  return submitRequest({
    url: `/amendments/document/${documentId}`,
    method: "post",
    data: amendmentDetails,
  });
};

export const useCreateAmendment = (
  documentId: string,
  options? : Options
) => {
  return useMutation({
    mutationFn: (amendmentDetails: CreateAmendmentModel) => {
      if (!documentId) {
        return Promise.reject(new Error("Socument ID is required"));
      }
      return createAmendment(documentId, amendmentDetails);
    },
    ...options,
  });
};
