import {
  AvailableDocumentModel,
  CreateDocumentModel,
  DocumentCategoryModel,
  DocumentLabelModel,
  DocumentModel,
  DocumentDetailsModel,
  EaoSearchResponse,
  ProjectDocumentAllAmendmentsModel
} from "@/models/Document";
import { submitRequest, requestAxios } from "@/utils/axiosUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const fetchDocumentLabels = (projectId: string, documentTypeId?: number) => {
  return submitRequest<DocumentLabelModel[]>({
    url: `/documents/project/${projectId}/labels`,
    params: documentTypeId ? { documentTypeId } : undefined,
  });
};

export const useGetDocumentLabels = (projectId?: string, documentTypeId?: number) => {
  return useQuery({
    queryKey: [QUERY_KEY.PROJECTDOCUMENT, projectId, documentTypeId, 'labels'],
    queryFn: () => fetchDocumentLabels(projectId!, documentTypeId),
    enabled: Boolean(projectId && documentTypeId),
    ...defaultUseQueryOptions,
  });
};

const EAO_SEARCH_BASE = 'https://projects.eao.gov.bc.ca/api/search';

const EAO_PAGE_SIZE = 1000;

const fetchEaoPage = (projectId: string, pageNum: number) => {
  const params = new URLSearchParams({
    dataset: 'Document',
    pageNum: String(pageNum),
    pageSize: String(EAO_PAGE_SIZE),
    projectLegislation: 'default',
    populate: 'false',
    fuzzy: 'false',
    'and[project]': projectId,
    fields: '',
  });
  params.append('sortBy', '+displayName');
  return requestAxios({ url: `${EAO_SEARCH_BASE}?${params.toString()}`, method: 'get' })
    .then((data): EaoSearchResponse => {
      const results: EaoSearchResponse[] = Array.isArray(data) ? data : [data];
      return results[0];
    });
};

const fetchEaoDocuments = async (projectId: string): Promise<EaoSearchDocumentResult[]> => {
  const first = await fetchEaoPage(projectId, 0);
  const total = first?.meta?.[0]?.searchResultsTotal ?? 0;
  const allResults = [...(first?.searchResults ?? [])];

  if (total > EAO_PAGE_SIZE) {
    const extraPages = Math.ceil((total - EAO_PAGE_SIZE) / EAO_PAGE_SIZE);
    const pages = await Promise.all(
      Array.from({ length: extraPages }, (_, i) => fetchEaoPage(projectId, i + 1))
    );
    pages.forEach(p => allResults.push(...(p?.searchResults ?? [])));
  }

  return allResults;
};

export const useSearchEaoDocuments = (projectId?: string, enabled = false) => {
  return useQuery({
    queryKey: ['eao-documents', projectId],
    queryFn: () => fetchEaoDocuments(projectId!),
    enabled: Boolean(projectId) && enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

const fetchDocumentCategories = () => {
  return submitRequest<DocumentCategoryModel[]>({ url: '/document-category/' });
};

export const useGetDocumentCategories = () => {
  return useQuery({
    queryKey: [QUERY_KEY.DOCUMENTTYPE, 'categories'],
    queryFn: fetchDocumentCategories,
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

const fetchDocumentsByProject = (projectId?: string, documentId?: string, documentType?: string) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }

  return submitRequest<DocumentModel>({
    url: `/documents/project/${projectId}`,
    params: {
      documentId,
      documentType,
    },
  });

};

export const useGetDocumentsByProject = (
  shouldLoad: boolean,
  projectId?: string,
  documentId?: string,
  documentType?: string
) => {
  return useQuery({
    queryKey: [
      QUERY_KEY.PROJECTDOCUMENT,
      projectId,
      documentId,
      documentType,
    ],
    queryFn: () => fetchDocumentsByProject(projectId, documentId, documentType),
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
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.DOCUMENTDETAIL, documentId] });
      queryClient.removeQueries({ queryKey: [QUERY_KEY.PROJECTDOCUMENT] });
      queryClient.removeQueries({ queryKey: [QUERY_KEY.DOCUMENT] });

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

const fetchAvailableDocuments = (projectId: string) => {
  return submitRequest<AvailableDocumentModel[]>({
    url: `/documents/project/${projectId}/available`,
  });
};

export const useGetAvailableDocuments = (projectId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEY.AVAILABLE_DOCUMENTS, projectId],
    queryFn: () => fetchAvailableDocuments(projectId!),
    enabled: Boolean(projectId),
    ...defaultUseQueryOptions,
  });
};

const activateDocument = (documentId: string) => {
  return submitRequest({
    url: `/documents/${documentId}/activate`,
    method: "PATCH",
  });
};

export const useActivateDocument = (options?: Options) => {
  return useMutation({
    mutationFn: (documentId: string) => activateDocument(documentId),
    ...options,
  });
};
