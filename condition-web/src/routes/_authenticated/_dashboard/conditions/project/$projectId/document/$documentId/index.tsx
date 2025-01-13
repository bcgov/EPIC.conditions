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
    { title: `${params.projectId}`, path: `/projects/` },
    { title: `Document Category`, path: `/documents/projects/${params.projectId}/document-category/` },
    { title: `Document Label`, path: undefined }
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
  } = useLoadConditions(true, false, projectId, documentId);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError]);

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const META_DOCUMENT_LABEL = `Document Label`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (documentConditions) {
      replaceBreadcrumb(META_PROJECT_TITLE, documentConditions?.project_name || META_PROJECT_TITLE);

      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        documentConditions?.document_category || META_DOCUMENT_CATEGORY,
        `/documents/project/${projectId}/document-category/${documentConditions.document_category_id}/`
      );

      replaceBreadcrumb(
        META_DOCUMENT_LABEL,
        documentConditions?.document_label || META_DOCUMENT_LABEL,
        undefined
      );
    }
  }, [documentConditions, projectId, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_CATEGORY, META_DOCUMENT_LABEL]);

  if (isConditionsError) return <Navigate to="/error" />;

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
              projectId = {projectId}
              documentCategory = {documentConditions?.document_category || ""}
              documentLabel = {documentConditions?.document_label || ""}
              documentId = {documentId}
              conditions={documentConditions?.conditions}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
