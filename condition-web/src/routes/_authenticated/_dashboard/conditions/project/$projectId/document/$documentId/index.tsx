import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadConditions } from "@/hooks/api/useConditions";
import { Conditions, ConditionsSkeleton } from "@/components/Conditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/conditions/project/$projectId/document/$documentId/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Condition not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` }, // Fixed Projects path
    { title: `${params.documentId}`, path: `/_authenticated/_dashboard/conditions/project/${params.projectId}/document/${params.documentId}/` } // Path to the specific document
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
  } = useLoadConditions(projectId, documentId);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  if (isConditionsError) return <Navigate to="/error" />;

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_TITLE = `${documentId}`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (documentConditions) {
      replaceBreadcrumb(META_PROJECT_TITLE, documentConditions?.project_name || "");
      replaceBreadcrumb(META_DOCUMENT_TITLE, documentConditions?.document_type || "");
    }
  }, [documentConditions, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_TITLE]);

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isConditionsLoading}>
          <Then>
            <ConditionsSkeleton />
          </Then>
          <Else>
            <Conditions
              projectName = {documentConditions?.project_name || ""}
              documentName = {documentConditions?.document_type || ""}
              conditions={documentConditions?.conditions}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
