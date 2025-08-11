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
    return <p>Document Category not found!</p>;
  },
  meta: ({ params }) => [
    { title: "Home", path: "/projects" },
    { title: `${params.projectId}`, path: `/projects` },
    { title: `${params.categoryId}`, path: `/projects` }
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

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_CATEGORY = `${categoryId}`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (allDocuments) {
      replaceBreadcrumb("Home", "Home", "/projects", true);
      replaceBreadcrumb(
        META_PROJECT_TITLE,
        allDocuments?.project_name || META_PROJECT_TITLE,
        `/projects/${projectId}`,
        true
      );
      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        allDocuments?.document_category || META_DOCUMENT_CATEGORY,
        undefined,
        false
      );
    }
  }, [allDocuments, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_CATEGORY, projectId]);

  if (isAmendmentsError) return <Navigate to="/error" />;

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
              categoryId = {categoryId}
              documentLabel = {allDocuments?.document_category || ""}
              documents={allDocuments?.documents}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
