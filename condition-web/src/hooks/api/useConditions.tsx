import {
  ProjectDocumentConditionDetailModel,
  ProjectDocumentConditionModel,
  updateTopicTagsModel
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Options } from "./types";

const loadConditions = (projectId?: string, documentId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<ProjectDocumentConditionModel>({
    url: `/conditions/project/${projectId}/document/${documentId}`,
  });
};

export const useLoadConditions = (projectId?: string, documentId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId],
    queryFn: () => loadConditions(projectId, documentId),
    enabled: Boolean(projectId && documentId),
    retry: false,
  });
};

const loadConditionDetails = (projectId?: string, documentId?: string, conditionNumber?: number) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  if (!conditionNumber) {
    return Promise.reject(new Error("Condition Number is required"));
  }
  return submitRequest<ProjectDocumentConditionDetailModel>({
    url: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionNumber}`,
  });
};

export const useLoadConditionDetails = (projectId?: string, documentId?: string, conditionNumber?: number) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId, "conditions", conditionNumber],
    queryFn: () => loadConditionDetails(projectId, documentId, conditionNumber),
    enabled: Boolean(projectId && documentId && conditionNumber),
    retry: false,
  });
};

const updateConditionDetails = (
  projectId: string,
  documentId: string,
  conditionNumber: number,
  conditionDetails: updateTopicTagsModel
) => {
  return submitRequest({
    url: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionNumber}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateConditionDetails = (
  projectId?: string,
  documentId?: string,
  conditionNumber?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails: updateTopicTagsModel) => {
      if (!projectId) {
        return Promise.reject(new Error("Project ID is required"));
      }
      if (!documentId) {
        return Promise.reject(new Error("Document ID is required"));
      }
      if (!conditionNumber) {
        return Promise.reject(new Error("Condition Number is required"));
      }
      return updateConditionDetails(projectId, documentId, conditionNumber, conditionDetails);
    },
    ...options,
  });
};
