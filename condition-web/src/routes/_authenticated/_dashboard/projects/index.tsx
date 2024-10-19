import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetProjects } from "@/hooks/api/useProjects";

import { Else, If, Then } from "react-if";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PageGrid } from "@/components/Shared/PageGrid";

export const Route = createFileRoute("/_authenticated/_dashboard/projects/")({
  component: ProjectsPage,
  meta: () => [{ title: "Home" }],
});

export function ProjectsPage() {
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
  } = useGetProjects();

  useEffect(() => {
    if (isProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isProjectsError]);

  if (isProjectsError) {
    return <Navigate to={"/error"} />;
  }

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isProjectsLoading}>
          <Then>
            <ProjectsSkeleton />
          </Then>
          <Else>
            <Projects projects={projectsData} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
