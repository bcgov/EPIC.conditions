import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadDocuments } from "@/hooks/api/useDocuments";
import { Documents, DocumentsSkeleton } from "@/components/Documents";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/documents/project/$projectId/document-category/$categoryId/"
)({
  component: DocumentPage,
  notFoundComponent: () => {
    return <p>Document not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects/` }, // Fixed Projects path
    { title: `${params.categoryId}`, path: `/_authenticated/_dashboard/documents/projects/${params.projectId}/document-category/${params.categoryId}/` } // Path to the specific document
  ],
});

function DocumentPage() {
  const { projectId: projectIdParam, categoryId: categoryIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const categoryId = Number(categoryIdParam);
  const {
    data: allDocuments,
    isPending: isDocumentsLoading,
    isError: isAmendmentsError
  } = useLoadDocuments(projectId, categoryId);

  useEffect(() => {
    if (isAmendmentsError) {
      notify.error("Failed to load documents");
    }
  }, [isAmendmentsError]);

  if (isAmendmentsError) return <Navigate to="/error" />;

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_TITLE = `${categoryId}`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (allDocuments) {
      replaceBreadcrumb(META_PROJECT_TITLE, allDocuments?.project_name || "");
      replaceBreadcrumb(META_DOCUMENT_TITLE, allDocuments?.document_type || "");
    }
  }, [allDocuments, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_TITLE]);

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isDocumentsLoading}>
          <Then>
            <DocumentsSkeleton />
          </Then>
          <Else>
            <Documents
              projectName = {allDocuments?.project_name || ""}
              projectId = {projectId}
              documentName = {allDocuments?.document_category || ""}
              documents={allDocuments?.documents}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
