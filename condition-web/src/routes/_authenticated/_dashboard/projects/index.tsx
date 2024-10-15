import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@mui/material";

import { If, Then } from "react-if";
import { ProjectsSkeleton } from "@/components/Projects";
import { PageGrid } from "@/components/Shared/PageGrid";

export const Route = createFileRoute("/_authenticated/_dashboard/projects/")({
  component: ProjectsPage,
  meta: () => [{ title: "All Projects" }],
});

export function ProjectsPage() {
  const isProjectsLoading = true

  return (
    <PageGrid>
      <Grid item xs={12}>
        <If condition={isProjectsLoading}>
          <Then>
            <ProjectsSkeleton />
          </Then>
        </If>
      </Grid>
    </PageGrid>
  );
}
