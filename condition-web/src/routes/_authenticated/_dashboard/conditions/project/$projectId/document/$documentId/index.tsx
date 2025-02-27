import { useState, useEffect } from "react";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadDocumentDetails } from "@/hooks/api/useDocuments";
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
    { title: "Home", path: "/projects" },
    { title: `${params.projectId}`, path: `/projects` },
    { title: `Document Category`, path: `/documents/projects/${params.projectId}/document-category` },
    { title: `Document Label`, path: undefined }
  ],
});

function ConditionPage() {
  const { projectId: projectIdParam, documentId: documentIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);

  const {
    data: documentDetails,
    isPending: isDocumentDetailsLoading,
    isError: isDocumentDetailsError
  } = useLoadDocumentDetails(documentId);

  const {
    data: documentConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useLoadConditions(true, false, projectId, documentId);

  useEffect(() => {
    if (isDocumentDetailsError) {
      notify.error("Failed to load document details");
    }
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError, isDocumentDetailsError]);

  const META_PROJECT_TITLE = `${projectId}`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const META_DOCUMENT_LABEL = `Document Label`;
  const { replaceBreadcrumb } = useBreadCrumb();

  const [documentLabel, setDocumentLabel] = useState<string>("");

  useEffect(() => {
    if (documentDetails) {
      setDocumentLabel(documentDetails.document_label || "Document Label"); 

      replaceBreadcrumb("Home", "Home", "/projects", true);

      replaceBreadcrumb(
        META_PROJECT_TITLE,
        documentDetails?.project_name || META_PROJECT_TITLE,
        `/projects`,
        true
      );

      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        documentDetails?.document_category || META_DOCUMENT_CATEGORY,
        `/documents/project/${projectId}/document-category/${documentDetails.document_category_id}/`,
        true
      );

      replaceBreadcrumb(
        META_DOCUMENT_LABEL,
        documentDetails?.document_label || META_DOCUMENT_LABEL,
        undefined,
        false
      );
    }
  }, [
    documentDetails,
    documentConditions,
    projectId,
    replaceBreadcrumb,
    META_PROJECT_TITLE,
    META_DOCUMENT_CATEGORY,
    META_DOCUMENT_LABEL
  ]);

  const handleDocumentLabelChange = (newLabel: string) => {
    setDocumentLabel(newLabel);
    
    // Update breadcrumb immediately when label changes
    replaceBreadcrumb(META_DOCUMENT_LABEL, newLabel, undefined, false);
  };

  if (isConditionsError || isDocumentDetailsError) return <Navigate to="/error" />;

  if (isDocumentDetailsLoading || isConditionsLoading) {
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
          projectName = {documentDetails?.project_name || ""}
          projectId = {projectId}
          documentCategory = {documentDetails?.document_category || ""}
          documentLabel = {documentLabel || ""}
          documentId = {documentId}
          conditions={documentConditions?.conditions}
          documentTypeId={documentDetails?.document_type_id}
          onDocumentLabelChange={handleDocumentLabelChange}
        />
      </Grid>
    </PageGrid>
  );
}
