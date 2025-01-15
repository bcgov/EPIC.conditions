import { useEffect } from "react";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadDocumentDetails } from "@/hooks/api/useDocuments";
import { useConsolidatedConditions } from "@/hooks/api/useConsolidatedConditions";
import { Conditions, ConditionsSkeleton } from "@/components/Conditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/conditions/project/$projectId/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Condition not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` }
  ],
});

function ConditionPage() {
  const { projectId: projectIdParam, documentId: documentIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);

  const {
    data: documentConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useConsolidatedConditions(projectId);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  if (isConditionsError) return <Navigate to="/error" />;

  if (isConditionsLoading) {
    return (
      <PageGrid>
        <Grid item xs={12}>
          <ConditionsSkeleton />
        </Grid>
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <Conditions
          projectName = {""}
          projectId = {projectId}
          documentCategory = {""}
          documentLabel = {""}
          documentId = {documentId}
          conditions={documentConditions?.conditions}
        />
      </Grid>
    </PageGrid>
  );
}
