import { useState } from "react";
import { ProjectModel } from "@/models/Project";
import { Stack, Pagination, Typography, Box } from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";

type ProjectsParams = {
  projects?: { projects: ProjectModel[] };
};

export const Projects = ({ projects }: ProjectsParams) => {
  const projectArray = projects?.projects || [];
  const itemsPerPage = 10; // Number of projects per page
  const [page, setPage] = useState(1); // Current page

  if (!projects) return <Navigate to={"/error"} />;

  // Calculate total pages
  const totalPages = Math.ceil(projectArray.length / itemsPerPage);
  
  // Calculate the start and end indices for the current page
  const startIndex = (page - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, projectArray.length);

  // Get the subset of projects for the current page
  const paginatedProjects = projectArray?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      {/* Showing results message */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1">
          Showing {startIndex} to {endIndex} of {projectArray.length} results
        </Typography>
        {/* Pagination Component */}
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {paginatedProjects?.map((project) => (
        <Project key={project.project_id} project={project} />
      ))}
    </Stack>
  );
};

export const ProjectsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
