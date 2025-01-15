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

const loadDocuments = (projectId?: string, categoryId?: number) => {
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

export const useLoadDocuments = (projectId?: string, categoryId?: number) => {
  return useQuery({
    queryKey: ["projects", projectId, "documents", categoryId],
    queryFn: () => loadDocuments(projectId, categoryId),
    enabled: Boolean(projectId && categoryId),
    retry: false,
  });
};

const fetchDocumentType = () => {
  return submitRequest({url: '/documents/type'});
};

export const useLoadDocumentType = () => {
  return useQuery({
    queryKey: ["document-type"],
    queryFn: () => fetchDocumentType(),
    retry: false,
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

const loadDocumentsByProject = (projectId?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<DocumentModel>({
    url: `/documents/project/${projectId}`,
  });
};

export const useLoadDocumentsByProject = (shouldLoad: boolean, projectId?: string) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => loadDocumentsByProject(projectId),
    enabled: Boolean(projectId && shouldLoad),
    retry: false,
  });
};

const loadDocumentDetails = (documentId?: string) => {
  if (!documentId) {
    return Promise.reject(new Error("Document ID is required"));
  }
  return submitRequest<DocumentDetailsModel>({
    url: `/documents/${documentId}`,
  });
};

export const useLoadDocumentDetails = (documentId?: string) => {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => loadDocumentDetails(documentId),
    enabled: Boolean(documentId),
    retry: false,
  });
};
