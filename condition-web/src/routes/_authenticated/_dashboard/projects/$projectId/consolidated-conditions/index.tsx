import { useEffect } from "react";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useGetConsolidatedConditions } from "@/hooks/api/useConsolidatedConditions";
import { ConsolidatedConditionsPageContent } from "@/components/ConsolidatedConditions/ConsolidatedConditionsPageContent";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useProjectConsolidatedBreadcrumbs } from "@/hooks/useProjectConsolidatedBreadcrumbs";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/$projectId/consolidated-conditions/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Conditions not found!</p>;
  },
  meta: () => [],
});

function ConditionPage() {
  const { projectId: projectIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);

  const {
    data: consolidatedConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError,
  } = useGetConsolidatedConditions(projectId, "", true);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  useProjectConsolidatedBreadcrumbs(projectId, consolidatedConditions?.project_name);

  if (isConditionsError) return <Navigate to="/error" />;

  return (
    <ConsolidatedConditionsPageContent
      isLoading={isConditionsLoading}
      projectName={consolidatedConditions?.project_name}
      projectId={projectId}
      documentCategory={consolidatedConditions?.document_category}
      documentCategoryId=""
      conditions={consolidatedConditions?.conditions}
      consolidationLevel="project"
    />
  );
}
