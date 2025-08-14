import {
  CreateDocumentModel,
  DocumentModel,
  DocumentDetailsModel,
  ProjectDocumentAllAmendmentsModel
} from "@/models/Document";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Options } from "./types";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const fetchDocuments = (projectId?: string, categoryId?: number) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  if (!categoryId) {
    return Promise.reject(new Error("Category ID is required"));
  }
  return submitRequest<ProjectDocumentAllAmendmentsModel>({
    url: `/document-category/project/${projectId}/category/${categoryId}`,
  });
};

export const useGetDocuments = (projectId?: string, categoryId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.DOCUMENT, projectId, categoryId],
    queryFn: () => fetchDocuments(projectId, categoryId),
    enabled: Boolean(projectId && categoryId),
    ...defaultUseQueryOptions,
  });
};

const fetchDocumentType = () => {
  return submitRequest({url: '/documents/type'});
};

export const useGetDocumentType = () => {
  return useQuery({
    queryKey: [QUERY_KEY.DOCUMENTTYPE],
    queryFn: () => fetchDocumentType(),
    ...defaultUseQueryOptions,
  });
};

const createDocument = (
  projectId: string,
  documentDetails: CreateDocumentModel
) => {
  return submitRequest({
    url: `/documents/project/${projectId}`,
    method: "post",
    data: documentDetails,
  });
};

export const useCreateDocument = (
  projectId?: string,
  options? : Options
) => {
  return useMutation({
    mutationFn: (documentDetails: CreateDocumentModel) => {
      if (!projectId) {
        return Promise.reject(new Error("Project ID is required"));
      }
      return createDocument(projectId, documentDetails);
    },
    ...options,
  });
};

const fetchDocumentsByProject = (projectId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<DocumentModel>({
    url: `/documents/project/${projectId}`,
  });
};

export const useGetDocumentsByProject = (shouldLoad: boolean, projectId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.PROJECTDOCUMENT, projectId],
    queryFn: () => fetchDocumentsByProject(projectId),
    enabled: Boolean(projectId && shouldLoad),
    ...defaultUseQueryOptions,
  });
};

const fetchDocumentDetails = (documentId?: string) => {
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<DocumentDetailsModel>({
    url: `/documents/${documentId}`,
  });
};

export const useGetDocumentDetails = (documentId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.DOCUMENTDETAIL, documentId],
    queryFn: () => fetchDocumentDetails(documentId),
    enabled: Boolean(documentId),
    ...defaultUseQueryOptions,
  });
};

const updateDocument = (documentId: string, documentLabel: string) => {
  return submitRequest({
    url: `/documents/${documentId}`,
    method: "PATCH",
    data: { document_label: documentLabel },
  });
};

export const useUpdateDocument = (
  documentId?: string,
  options?: Options
) => {
  return useMutation({
    mutationFn: async (documentLabel: string) => {
      if (!documentId) {
        return Promise.reject(new Error("Document ID is required"));
      }
      const response = await updateDocument(documentId, documentLabel);
      return response.data;
    },
    onSuccess: (updatedDocument) => {
      notify.success("Document name updated successfully!");

      if (options?.onSuccess) {
        options.onSuccess(updatedDocument); // Pass the updated document back
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const errorMessage =
        error?.response?.data?.message || "An unknown error occurred.";
      notify.error(errorMessage);
      
      if (options?.onError) {
        options.onError();
      }
    },
    ...options,
  });
};
