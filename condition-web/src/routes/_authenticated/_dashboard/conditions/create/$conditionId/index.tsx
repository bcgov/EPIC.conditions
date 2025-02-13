import { useEffect } from "react";
import { Else, If, Then } from "react-if";
import { PageGrid } from "@/components/Shared/PageGrid";
import { Grid } from "@mui/material";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { useLoadConditionByID } from "@/hooks/api/useConditions";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { ConditionsSkeleton } from "@/components/Conditions";
import { CreateConditionPage } from "@/components/ConditionDetails/CreateCondition";

export const Route = createFileRoute('/_authenticated/_dashboard/conditions/create/$conditionId/')({
  component: ConditionPage,
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

function ConditionPage() {
  const { conditionId: projectIdParam } = useParams({ strict: false });
  const conditionId = String(projectIdParam);

  const {
    data: conditionDetails,
    isPending: isConditionDetailsLoading,
    isError: isConditionDetailsError
  } = useLoadConditionByID(conditionId);

  const META_PROJECT_TITLE = `Project Name`;
  const META_DOCUMENT_CATEGORY = `Document Category`;
  const META_DOCUMENT_LABEL = `Document Label`;
  const { replaceBreadcrumb } = useBreadCrumb();
  useEffect(() => {
    if (conditionDetails) {
      replaceBreadcrumb("Home", "Home", "/projects", true);

      replaceBreadcrumb(
        META_PROJECT_TITLE,
        conditionDetails?.project_name || META_PROJECT_TITLE,
        `/projects`,
        true
      );

      replaceBreadcrumb(
        META_DOCUMENT_CATEGORY,
        conditionDetails?.document_category || META_DOCUMENT_CATEGORY,
        `/documents/project/${conditionDetails.project_id}/document-category/${conditionDetails.document_category_id}/`,
        true
      );

      replaceBreadcrumb(
        META_DOCUMENT_LABEL,
        conditionDetails?.document_label || META_DOCUMENT_LABEL,
        undefined,
        false
      );
    }
  }, [conditionDetails, replaceBreadcrumb, META_PROJECT_TITLE, META_DOCUMENT_CATEGORY, META_DOCUMENT_LABEL]);

  if (isConditionDetailsError) return <Navigate to="/error" />;

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isConditionDetailsLoading}>
          <Then>
            <ConditionsSkeleton />
          </Then>
          <Else>
            <CreateConditionPage
              conditionData = {conditionDetails}
            />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}