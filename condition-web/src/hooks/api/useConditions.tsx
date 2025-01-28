import {
  ConditionModel,
  ProjectDocumentConditionDetailModel,
  ProjectDocumentConditionModel,
  updateTopicTagsModel
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Options } from "./types";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

const loadConditions = (includeSubconditions: boolean, projectId?: string, documentId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<ProjectDocumentConditionModel>({
    url: `/conditions/project/${projectId}/document/${documentId}?include_subconditions=${includeSubconditions}`,
  });
};

export const useLoadConditions = (
  shouldLoad: boolean,
  includeSubconditions: boolean,
  projectId?: string,
  documentId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId],
    queryFn: () => loadConditions(includeSubconditions, projectId, documentId),
    enabled: Boolean(projectId && documentId && shouldLoad),
    retry: false,
  });
};

const loadConditionDetails = (projectId?: string, documentId?: string, conditionId?: number) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  if (!conditionId) {
    return Promise.reject(new Error("Condition ID is required"));
  }
  return submitRequest<ProjectDocumentConditionDetailModel>({
    url: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionId}`,
  });
};

export const useLoadConditionDetails = (projectId?: string, documentId?: string, conditionId?: number) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", documentId, "conditions", conditionId],
    queryFn: () => loadConditionDetails(projectId, documentId, conditionId),
    enabled: Boolean(projectId && documentId && conditionId),
    retry: false,
  });
};

const updateConditionDetails = (
  projectId: string,
  documentId: string,
  conditionId: number,
  conditionDetails: updateTopicTagsModel,
  checkConditionExists: boolean,
  check_condition_over_project: boolean,
) => {
  return submitRequest({
    url: `/conditions/project/${projectId}/document/${documentId}/condition/${conditionId}` +
         `?check_condition_exists=${checkConditionExists}&check_condition_over_project=${check_condition_over_project}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateConditionDetails = (
  checkConditionExists: boolean,
  check_condition_over_project: boolean,
  projectId?: string,
  documentId?: string,
  conditionId?: number,
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
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateConditionDetails(projectId, documentId, conditionId,
        conditionDetails, checkConditionExists, check_condition_over_project);
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
    url: `/conditions/${conditionId}`,
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
  check_condition_over_project: boolean,
  conditionId: number,
  conditionDetails: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/${conditionId}?check_condition_over_project=${check_condition_over_project}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateCondition = (
  check_condition_over_project?: boolean,
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails: ConditionModel) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      const isCheckConditionOverProject = check_condition_over_project ?? true;
      return updateCondition(isCheckConditionOverProject, conditionId, conditionDetails);
    },
    onSuccess: () => {
      notify.success("Condition updated successfully!"); // Success notification
      if (options?.onSuccess) {
        options.onSuccess(); // Call the optional custom onSuccess handler
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const errorMessage =
        error?.response?.data?.message || "An unknown error occurred.";
      console.log(errorMessage); // Error notification
      if (options?.onError) {
        options.onError(); // Call the optional custom onError handler
      }
    },
    ...options,
  });
};

const removeCondition = (
  conditionId: number,
) => {
  return submitRequest({
    url: `/conditions/${conditionId}`,
    method: "delete",
  });
};

export const useRemoveCondition = (
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: () => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return removeCondition(conditionId);
    },
    ...options,
  });
};
