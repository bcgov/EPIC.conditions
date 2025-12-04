import { AxiosError } from "axios";
import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import { useGetDocumentType } from "@/hooks/api/useDocuments";
import { useGetProjects } from "@/hooks/api/useProjects";
import { Else, If, Then } from "react-if";
import { Projects, ProjectsSkeleton } from "@/components/Projects";
import { useEffect } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { PageGrid } from "@/components/Shared/PageGrid";
import { HTTP_STATUS_CODES } from "../../../../../hooks/api/constants";
import { ProjectModel } from "@/models/Project";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

export const Route = createFileRoute("/_authenticated/_dashboard/projects/$projectId/")({
  component: ProjectsPage,
  meta: ({ params }) => [
    { title: "Home", path: "/projects/" },
    { title: `${params.projectId}`, path: `/projects` }
  ],
});

export function ProjectsPage() {
  const { projectId } = useParams({ strict: false });
  const { replaceBreadcrumb, breadcrumbs } = useBreadCrumb();
  const {
    data: projectsData,
    isPending: isProjectsLoading,
    isError: isProjectsError,
    error,
  } = useGetProjects();

  const { data: documentTypeData } = useGetDocumentType();

  // Check if the error is a 404 Not Found error
  const axiosError = error as AxiosError;

  const filteredProjects = projectId
  ? projectsData?.filter((project: ProjectModel) => project.project_id === projectId)
  : projectsData;

  const META_PROJECT_TITLE = `${filteredProjects?.[0]?.project_id}`;

  useEffect(() => {
    if (isProjectsError) {
      notify.error("Failed to load projects");
    }
  }, [isProjectsError]);

  useEffect(() => {
    if (filteredProjects && filteredProjects.length > 0) {
      const selectedProject = filteredProjects[0];

      // Check if the breadcrumb for the current project already exists
      const breadcrumbExists = breadcrumbs.some(
        (breadcrumb) => breadcrumb.path === `/projects/${selectedProject.project_id}`
      );

      // Only update breadcrumbs if they don't already exist
      if (!breadcrumbExists) {
        replaceBreadcrumb("Home", "Home", "/projects", true);
        replaceBreadcrumb(
          META_PROJECT_TITLE,
          selectedProject.project_name || META_PROJECT_TITLE,
          `/projects/${projectId}`,
          false
        );
      }
    }
  }, [filteredProjects, projectId, META_PROJECT_TITLE, replaceBreadcrumb, breadcrumbs]);

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
            <Projects projects={filteredProjects} documentType={documentTypeData} />
          </Else>
        </If>
      </Grid>
    </PageGrid>
  );
}
