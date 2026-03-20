import { useEffect } from "react";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useGetConsolidatedConditions } from "@/hooks/api/useConsolidatedConditions";
import { ConsolidatedConditionsPageContent } from "@/components/ConsolidatedConditions/ConsolidatedConditionsPageContent";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/projects/$projectId/document-category/$categoryId/consolidated-conditions/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Conditions not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` },
    { title: `Document Category`, path: `/documents/projects/${params.projectId}/document-category/` },
    { title: `Consolidated Conditions`, path: undefined },
  ],
});

function ConditionPage() {
  const { projectId: projectIdParam, categoryId: categoryIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const categoryId = String(categoryIdParam);

  const {
    data: consolidatedConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError,
  } = useGetConsolidatedConditions(projectId, categoryId, false);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  const { replaceBreadcrumb } = useBreadCrumb();

  useEffect(() => {
    if (consolidatedConditions) {
      replaceBreadcrumb("Home", "Home", "/projects", true);
      replaceBreadcrumb(
        projectId,
        consolidatedConditions.project_name || projectId,
        `/projects/${projectId}`,
        true
      );
      replaceBreadcrumb(
        "Document Category",
        consolidatedConditions.document_category || "Document Category",
        `/documents/project/${projectId}/document-category/${categoryId}/`,
        true
      );
    }
  }, [consolidatedConditions, replaceBreadcrumb, categoryId, projectId]);

  if (isConditionsError) return <Navigate to="/error" />;

  return (
    <ConsolidatedConditionsPageContent
      isLoading={isConditionsLoading}
      projectName={consolidatedConditions?.project_name}
      projectId={projectId}
      documentCategory={consolidatedConditions?.document_category}
      documentCategoryId={categoryId}
      conditions={consolidatedConditions?.conditions}
      consolidationLevel="document-category"
    />
  );
}
