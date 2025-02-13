import { useEffect } from "react";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useConsolidatedConditionsByCategory } from "@/hooks/api/useConsolidatedConditions";
import { ConsolidatedConditions, ConsolidatedConditionsSkeleton } from "@/components/ConsolidatedConditions";
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
    { title: `Consolidated Conditions`, path: undefined }
  ],
});

function ConditionPage() {
  const { projectId: projectIdParam, categoryId: categoryIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const categoryId = String(categoryIdParam);

  const {
    data: consolidatedConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useConsolidatedConditionsByCategory(projectId, categoryId, false);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const { replaceBreadcrumb } = useBreadCrumb();

  useEffect(() => {
    if (consolidatedConditions) {
      replaceBreadcrumb("Home", "Home", "/projects", true);

      replaceBreadcrumb(
        META_PROJECT_TITLE,
        consolidatedConditions?.project_name || META_PROJECT_TITLE,
        `/projects`,
        true
      );

      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        consolidatedConditions?.document_category || META_DOCUMENT_CATEGORY,
        `/documents/project/${projectId}/document-category/${categoryId}/`,
        true
      );
    }
  }, [consolidatedConditions, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_CATEGORY]);

  if (isConditionsError) return <Navigate to="/error" />;

  if (isConditionsLoading) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <ConsolidatedConditionsSkeleton />
        </Grid>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <ConsolidatedConditions
          projectName = {consolidatedConditions?.project_name}
          projectId = {projectId}
          documentCategory = {consolidatedConditions?.document_category}
          documentCategoryId = {categoryId}
          conditions={consolidatedConditions?.conditions}
          consolidationLevel={'document-category'}
        />
      </Grid>
    </PageGrid>
  );
}
