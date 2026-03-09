import { useState, useEffect } from "react";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useGetDocumentDetails } from "@/hooks/api/useDocuments";
import { useGetConditions } from "@/hooks/api/useConditions";
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
  meta: () => [],
});

function ConditionPage() {
  const { projectId: projectIdParam, documentId: documentIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);

  const {
    data: documentDetails,
    isPending: isDocumentDetailsLoading,
    isError: isDocumentDetailsError
  } = useGetDocumentDetails(documentId);

  const {
    data: documentConditions,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useGetConditions(true, false, projectId, documentId);

  useEffect(() => {
    if (isDocumentDetailsError) {
      notify.error("Failed to load document details");
    }
    if (isConditionsError) {
      notify.error("Failed to load conditions");
    }
  }, [isConditionsError, isDocumentDetailsError]);

  const { setBreadcrumbs, setIsFromConsolidated } = useBreadCrumb();

  const [documentLabel, setDocumentLabel] = useState<string>("");

  useEffect(() => {
    setIsFromConsolidated(false);
  }, [setIsFromConsolidated]);

  useEffect(() => {
    if (documentDetails) {
      setDocumentLabel(documentDetails.document_label || "Document Label");

      setBreadcrumbs([
        { title: "Home", path: "/projects", clickable: true },
        { title: documentDetails?.project_name || "", path: `/projects/${projectId}`, clickable: true },
        { title: documentDetails?.document_category || "", path: `/documents/project/${projectId}/document-category/${documentDetails.document_category_id}/`, clickable: true },
        { title: documentDetails?.document_label || "", path: undefined, clickable: false }
      ]);
    }
  }, [documentDetails, projectId, setBreadcrumbs]);

  const handleDocumentLabelChange = (newLabel: string) => {
    setDocumentLabel(newLabel);
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
          projectName={documentDetails?.project_name || ""}
          projectId={projectId}
          documentCategory={documentDetails?.document_category || ""}
          documentLabel={documentLabel || ""}
          documentId={documentId}
          conditions={documentConditions?.conditions}
          documentTypeId={documentDetails?.document_type_id}
          onDocumentLabelChange={handleDocumentLabelChange}
        />
      </Grid>
    </PageGrid>
  );
}
