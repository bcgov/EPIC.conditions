import {
  ConditionModel,
  ProjectDocumentConditionDetailModel,
  ProjectDocumentConditionModel,
  updateTopicTagsModel
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Options } from "./types";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const fetchConditions = (includeSubconditions: boolean, projectId?: string, documentId?: string) => {
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

export const useGetConditions = (
  shouldLoad: boolean,
  includeSubconditions: boolean,
  projectId?: string,
  documentId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.CONDITIONS, projectId, documentId],
    queryFn: () => fetchConditions(includeSubconditions, projectId, documentId),
    enabled: Boolean(projectId && documentId && shouldLoad),
    ...defaultUseQueryOptions,
  });
};

const fetchConditionDetails = (projectId?: string, documentId?: string, conditionId?: number) => {
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

export const useGetConditionDetails = (projectId?: string, documentId?: string, conditionId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.CONDITIONSDETAIL, projectId, documentId, conditionId],
    queryFn: () => fetchConditionDetails(projectId, documentId, conditionId),
    enabled: Boolean(projectId && documentId && conditionId),
    ...defaultUseQueryOptions,
  });
};

const updateConditionDetails = (
  conditionId: number,
  conditionDetails: updateTopicTagsModel,
  checkConditionExists: boolean,
  check_condition_over_project: boolean,
) => {
  return submitRequest({
    url: `/conditions/${conditionId}/edit` +
         `?check_condition_exists=${checkConditionExists}&check_condition_over_project=${check_condition_over_project}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateConditionDetails = (
  checkConditionExists: boolean,
  check_condition_over_project: boolean,
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails: updateTopicTagsModel) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateConditionDetails(conditionId,
        conditionDetails, checkConditionExists, check_condition_over_project);
    },
    ...options,
  });
};

const createCondition = (
  projectId: string,
  documentId: string,
  allowDuplicateCondition: boolean,
  conditionDetails?: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/project/${projectId}/document/${documentId}?allow_duplicate_condition=${allowDuplicateCondition}`,
    method: "post",
    data: conditionDetails,
  });
};

export const useCreateCondition = (
  projectId?: string,
  documentId?: string,
  allowDuplicateCondition: boolean = false,
  options? : Options
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conditionDetails?: ConditionModel) => {
      if (!projectId) {
        return Promise.reject(new Error("Project ID is required"));
      }
      if (!documentId) {
        return Promise.reject(new Error("Document ID is required"));
      }
      return createCondition(projectId, documentId, allowDuplicateCondition, conditionDetails);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.CONDITIONS, projectId, documentId],
      });
      notify.success("Condition created successfully")
    },
    onError: () => notify.error("Failed to create condition"),
    ...options,
  });
};

const fetchConditionByID = (conditionId?: string) => {
  if (!conditionId) {
    return Promise.reject(new Error("Condition ID is required"));
  }
  return submitRequest<ProjectDocumentConditionDetailModel>({
    url: `/conditions/${conditionId}`,
  });
};

export const useGetConditionByID = (conditionId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.CONDITION, conditionId],
    queryFn: () => fetchConditionByID(conditionId),
    enabled: Boolean(conditionId),
    ...defaultUseQueryOptions,
  });
};

const updateCondition = (
  allow_duplicate_condition: boolean,
  conditionId: number,
  conditionDetails: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/${conditionId}?allow_duplicate_condition=${allow_duplicate_condition}`,
    method: "patch",
    data: conditionDetails,
  });
};

export const useUpdateCondition = (
  allow_duplicate_condition: boolean,
  conditionId?: number,
  options? : Options
) => {
  return useMutation({
    mutationFn: (conditionDetails: ConditionModel) => {
      if (!conditionId) {
        return Promise.reject(new Error("Condition ID is required"));
      }
      return updateCondition(allow_duplicate_condition, conditionId, conditionDetails);
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
      notify.error(errorMessage);
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

const saveNewCondition = (
  projectId: string,
  documentId: string,
  allowDuplicateCondition: boolean,
  conditionDetails: ConditionModel
) => {
  return submitRequest({
    url: `/conditions/project/${projectId}/document/${documentId}` +
         `?allow_duplicate_condition=${allowDuplicateCondition}` +
         `&check_condition_over_project=${!allowDuplicateCondition}`,
    method: "post",
    data: conditionDetails,
  });
};

export const useSaveNewCondition = (
  projectId?: string,
  documentId?: string,
  allowDuplicateCondition: boolean = false,
) => {
  return useMutation({
    mutationFn: (conditionDetails: ConditionModel) => {
      if (!projectId) {
        return Promise.reject(new Error("Project ID is required"));
      }
      if (!documentId) {
        return Promise.reject(new Error("Document ID is required"));
      }
      return saveNewCondition(projectId, documentId, allowDuplicateCondition, conditionDetails);
    },
  });
};
