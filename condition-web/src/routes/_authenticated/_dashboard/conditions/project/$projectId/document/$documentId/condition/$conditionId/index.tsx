import { useLayoutEffect, useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useGetConditionDetails } from "@/hooks/api/useConditions";
import { ConditionDetails, ConditionDetailsSkeleton } from "@/components/ConditionDetails";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute(
  "/_authenticated/_dashboard/conditions/project/$projectId/document/$documentId/condition/$conditionId/"
)({
  component: ConditionPage,
  notFoundComponent: () => {
    return <p>Condition not found!</p>;
  },
  meta: () => [],
});

function ConditionPage() {
  const { projectId: projectIdParam, documentId: documentIdParam, conditionId: conditionIdParam } = useParams({ strict: false });
  const projectId = String(projectIdParam);
  const documentId = String(documentIdParam);
  const conditionId = Number(conditionIdParam);

  const {
    data: conditionDetails,
    isPending: isConditionsLoading,
    isError: isConditionsError
  } = useGetConditionDetails(projectId, documentId, conditionId);

  useEffect(() => {
    if (isConditionsError) {
      notify.error("Failed to load condition");
    }
  }, [isConditionsError]);

  const { setBreadcrumbs, isFromConsolidated } = useBreadCrumb();

  useLayoutEffect(() => {
    if (conditionDetails) {
      if (isFromConsolidated) {
        setBreadcrumbs([
          { title: "Home", path: "/projects", clickable: true },
          { title: conditionDetails?.project_name || "", path: `/projects/${projectId}`, clickable: true },
          { title: "Consolidated Conditions", path: `/projects/${projectId}/consolidated-conditions`, clickable: true },
          { title: conditionDetails?.condition.condition_name || "", path: undefined, clickable: false }
        ]);
      } else {
        setBreadcrumbs([
          { title: "Home", path: "/projects", clickable: true },
          { title: conditionDetails?.project_name || "", path: `/projects/${projectId}`, clickable: true },
          { title: conditionDetails?.document_category || "", path: `/documents/project/${projectId}/document-category/${conditionDetails.document_category_id}/`, clickable: true },
          { title: conditionDetails?.document_label || "", path: undefined, clickable: false },
          { title: conditionDetails?.condition.condition_name || "", path: undefined, clickable: false }
        ]);
      }
    }
  }, [projectId, conditionDetails, setBreadcrumbs, isFromConsolidated]);

  if (isConditionsError) return <Navigate to="/error" />;

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isConditionsLoading}>
          <Then>
            <ConditionDetailsSkeleton />
          </Then>
          <Else>
            <ConditionDetails
              initialCondition={conditionDetails}
              projectId={projectId || ""}
              documentId={documentId || ""}
              conditionId={conditionId || 0}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
