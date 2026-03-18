import { ProjectDocumentConditionModel,
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { defaultUseQueryOptions, QUERY_KEY } from "./constants";

const fetchConsolidatedConditions = (
  projectId?: string,
  categoryId?: string,
  allConditions?: boolean
) => {
  if (!projectId) {
    return Promise.reject(new Error("Project ID is required"));
  }
  return submitRequest<ProjectDocumentConditionModel>({
    url: `/conditions/project/${projectId}?all_conditions=${allConditions}&category_id=${categoryId}`,
  });
};

export const useGetConsolidatedConditions = (
  projectId?: string, categoryId?: string, allConditions?: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEY.CONSOLIDATEDCONDITIONS, projectId],
    queryFn: () => fetchConsolidatedConditions(projectId, categoryId, allConditions),
    enabled: Boolean(projectId),
    ...defaultUseQueryOptions,
  });
};

const exportConsolidatedConditionsPDF = (projectId: string) => {
  return submitRequest<Blob>({
    url: `/conditions/project/${projectId}/render`,
    method: "post",
    data: { output_format: "pdf" },
    responseType: "blob",
  });
};

export const useExportConsolidatedConditionsPDF = (projectName: string) => {
  return useMutation({
    mutationFn: exportConsolidatedConditionsPDF,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Consolidated_Conditions_${projectName.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
};
