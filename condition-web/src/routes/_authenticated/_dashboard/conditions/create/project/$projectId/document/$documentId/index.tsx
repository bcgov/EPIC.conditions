import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useGetDocumentDetails } from "@/hooks/api/useDocuments";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { ConditionsSkeleton } from "@/components/Conditions";
import { CreateConditionPage } from "@/components/ConditionDetails/CreateCondition";
import { useCreateConditionStore } from "@/components/ConditionDetails/CreateCondition/createConditionStore";

export const Route = createFileRoute(
  '/_authenticated/_dashboard/conditions/create/project/$projectId/document/$documentId/'
)({
  component: CreateConditionRoute,
  notFoundComponent: () => {
    return <p>Condition not found!</p>;
  },
  meta: () => [
    { title: "Home", path: "/projects/" },
    { title: `Project Name`, path: `/projects/` },
    { title: `Document Category`, path: `/projects/` },
    { title: `Document Label`, path: undefined }
  ],
});

function CreateConditionRoute() {
  const { projectId, documentId } = useParams({ strict: false });

  const { initialCondition, clearInitialCondition } = useCreateConditionStore();

  useEffect(() => {
    return () => clearInitialCondition();
  }, [clearInitialCondition]);

  const {
    data: documentDetails,
    isPending: isDocumentDetailsLoading,
    isError: isDocumentDetailsError
  } = useGetDocumentDetails(documentId);

  const META_PROJECT_TITLE = `Project Name`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const META_DOCUMENT_LABEL = `Document Label`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (documentDetails) {
      replaceBreadcrumb("Home", "Home", "/projects", true);

      replaceBreadcrumb(
        META_PROJECT_TITLE,
        documentDetails?.project_name || META_PROJECT_TITLE,
        `/projects/${projectId}`,
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
  }, [documentDetails, projectId, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_CATEGORY, META_DOCUMENT_LABEL]);

  if (isDocumentDetailsError) return <Navigate to="/error" />;

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isDocumentDetailsLoading}>
          <Then>
            <ConditionsSkeleton />
          </Then>
          <Else>
            <CreateConditionPage
              projectId={projectId || ""}
              documentId={documentId || ""}
              projectName={documentDetails?.project_name || ""}
              documentLabel={documentDetails?.document_label || ""}
              initialCondition={initialCondition}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
