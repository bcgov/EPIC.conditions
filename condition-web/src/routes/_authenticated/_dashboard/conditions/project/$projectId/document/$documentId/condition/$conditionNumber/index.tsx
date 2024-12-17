import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadConditionDetails } from "@/hooks/api/useConditions";
import { ConditionDetails, ConditionDetailsSkeleton } from "@/components/ConditionDetails";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/conditions/project/$projectId/document/$documentId/condition/$conditionNumber/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Condition not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` },
    { title: `Document Category`, path: `/documents/projects/${params.projectId}/document-category/` },
    { title: `${params.documentId}`, path: `/conditions/project/${params.projectId}/document/${params.documentId}` }, // Path to the specific document
    { title: `${params.conditionNumber}`, path: `/conditions/project/${params.projectId}/document/${params.documentId}/condition/${params.conditionNumber}` } // Path to the specific document
  ],
});

function ConditionPage() {
  const { projectId: projectIdParam, documentId: documentIdParam, conditionNumber: conditionNumberParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);
  const conditionNumber = Number(conditionNumberParam);

  const {
    data: conditionDetails,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useLoadConditionDetails(projectId, documentId, conditionNumber);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load condition");
    }
  }, [isConditionsError]);

  if (isConditionsError) return <Navigate to="/error" />;

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const META_DOCUMENT_TITLE = `${documentId}`;
  const META_CONDITION_TITLE = `${conditionDetails?.condition.condition_number}`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (conditionDetails) {
      replaceBreadcrumb(META_PROJECT_TITLE, conditionDetails?.project_name || "");
      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        conditionDetails?.document_category || META_DOCUMENT_CATEGORY,
        `/documents/project/${projectId}/document-category/${conditionDetails.document_category_id}/`
      );
      replaceBreadcrumb(META_DOCUMENT_TITLE, conditionDetails?.document_label || "");
      replaceBreadcrumb(META_CONDITION_TITLE, conditionDetails?.condition.condition_name || "");
    }
  }, [
    conditionDetails,
    replaceBreadcrumb,
    META_PROJECT_TITLE,
    META_DOCUMENT_CATEGORY,
    META_DOCUMENT_TITLE,
    META_CONDITION_TITLE
  ]);

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isConditionsLoading}>
          <Then>
            <ConditionDetailsSkeleton />
          </Then>
          <Else>
            <ConditionDetails
              initialCondition = {conditionDetails}
              projectId = {projectId || ""}
              documentId = {documentId || ""}
              conditionNumber = {conditionNumber || 0}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
