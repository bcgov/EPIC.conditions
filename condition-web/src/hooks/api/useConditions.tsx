import {
  ConditionModel,
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

export const useLoadConditions = (shouldLoad: boolean, projectId?: string, documentId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId],
    queryFn: () => loadConditions(projectId, documentId),
    enabled: Boolean(projectId && documentId && shouldLoad),
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

const createCondition = (
  projectId: string,
  documentId: string,
  conditionDetails?: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/project/${projectId}/document/${documentId}`,
    method: "post",
    data: conditionDetails,
  });
};

export const useCreateCondition = (
  projectId?: string,
  documentId?: string,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails?: ConditionModel) => {
      if (!projectId) {
        return Promise.reject(new Error("Project ID is required"));
      }
      if (!documentId) {
        return Promise.reject(new Error("Document ID is required"));
      }
      return createCondition(projectId, documentId, conditionDetails);
    },
    ...options,
  });
};

const loadConditionByID = (conditionId?: string) => {
  if (!conditionId) {
    return Promise.reject(new Error("Condition ID is required"));
  }
  return submitRequest<ProjectDocumentConditionDetailModel>({
    url: `/conditions/create/${conditionId}`,
  });
};

export const useLoadConditionByID = (conditionId?: string) => {
  return useQuery({
    queryKey: ["condition", conditionId],
    queryFn: () => loadConditionByID(conditionId),
    enabled: Boolean(conditionId),
    retry: false,
  });
};

const updateCondition = (
  conditionId: number,
  conditionDetails: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/create/${conditionId}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateCondition = (
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails: ConditionModel) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateCondition(conditionId, conditionDetails);
    },
    ...options,
  });
};
