import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadAmendments } from "@/hooks/api/useAmendments";
import { Amendments, AmendmentsSkeleton } from "@/components/Amendments";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/amendments/project/$projectId/document/$documentId/"
)({
  component: AmendmentPage,
  notFoundComponent: () => {
    return <p>Amendment not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` }, // Fixed Projects path
    { title: `${params.documentId}`, path: `/_authenticated/_dashboard/amendments/projects/${params.projectId}/document/${params.documentId}/` } // Path to the specific document
  ],
});

function AmendmentPage() {
  const { projectId: projectIdParam, documentId: documentIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);
  const {
    data: allAmendments,
    isPending: isAmendmentsLoading,
    isError: isAmendmentsError
  } = useLoadAmendments(projectId, documentId);

  useEffect(() => {
    if (isAmendmentsError) {
      notify.error("Failed to load amendments");
    }
  }, [isAmendmentsError]);

  if (isAmendmentsError) return <Navigate to="/error" />;

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_TITLE = `${documentId}`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (allAmendments) {
      replaceBreadcrumb(META_PROJECT_TITLE, allAmendments?.project_name || "");
      replaceBreadcrumb(META_DOCUMENT_TITLE, allAmendments?.document_type || "");
    }
  }, [allAmendments, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_TITLE]);

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isAmendmentsLoading}>
          <Then>
            <AmendmentsSkeleton />
          </Then>
          <Else>
            <Amendments
              projectName = {allAmendments?.project_name || ""}
              projectId = {projectId}
              documentName = {allAmendments?.document_type || ""}
              documentId = {documentId}
              amendments={allAmendments?.amendments}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
