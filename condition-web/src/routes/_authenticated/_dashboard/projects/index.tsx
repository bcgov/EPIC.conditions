import { AxiosError } from "axios";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetDocumentType } from "@/hooks/api/useDocuments";
import { useGetProjects } from "@/hooks/api/useProjects";
import { Else, If, Then } from "react-if";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import { HTTP_STATUS_CODES } from "../../../../hooks/api/constants";

export const Route = createFileRoute("/_authenticated/_dashboard/projects/")({
  component: ProjectsPage,
  meta: () => [
    { title: "Home", path: "/projects/" },
  ],
});

export function ProjectsPage() {
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
    error,
  } = useGetProjects();

  const {
    data: documentTypeData,
  } = useGetDocumentType();

  useEffect(() => {
    if (isProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isProjectsError]);

  // Check if the error is a 404 Not Found error
  const axiosError = error as AxiosError;
  if (isProjectsError && axiosError?.response?.status === HTTP_STATUS_CODES.NOT_FOUND) {
    const errorMessage = (axiosError.response?.data as { message?: string })?.message || "Page not found";
    return <Navigate to={`/not-found?message=${encodeURIComponent(errorMessage)}`} />;
  }

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
            <Projects projects={projectsData} documentType={documentTypeData} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
