import { ProjectDocumentConditionModel,
} from "@/models/Condition";
import { submitRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
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
