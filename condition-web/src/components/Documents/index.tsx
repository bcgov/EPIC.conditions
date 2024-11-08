import { useState } from "react";
import { ProjectModel } from "@/models/Project";
import {
  Button,
  Grid,
  Stack,
  Pagination,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  TextField
} from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

type ProjectsParams = {
  projects?: { projects: ProjectModel[] };
};

export const Projects = ({ projects }: ProjectsParams) => {
  const projectArray = projects?.projects || [];
  const itemsPerPage = 10; // Number of projects per page
  const [page, setPage] = useState(1); // Current page
  const [projectSearch, setProjectSearch] = useState("");

  if (!projects) return <Navigate to={"/error"} />;

  const filteredProjects = projectArray.filter(project =>
    project.project_name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  
  // Calculate the start and end indices for the current page
  const startIndex = (page - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredProjects.length);

  // Get the subset of projects for the current page
  const paginatedProjects = filteredProjects?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>

    <Grid 
      container 
      alignItems="center" 
      paddingY={1} 
      paddingRight={2}
      spacing={2}
    >
      <Stack spacing={1} direction={"row"} sx={{ width: '100%' }}>
        {/* Filter Icon and Text */}
        <Box
          display="flex"
          justifyContent="left"
          alignItems="center"
          minWidth={"150px"}
        >
          <IconButton color="primary" sx={{ mr: 1 }}><TuneIcon /></IconButton>Open Filters
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search Projects"
          size="small"
          sx={{ width: "100%", paddingRight: "400px" }}
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          size="small"
          sx={{
            width: "50%",
            height: "70%",
            borderRadius: "4px",
            paddingLeft: "2px"
          }}
        >
          <AddIcon fontSize="small" /> Create New Document
        </Button>
      </Stack>
    </Grid>

      {/* Showing results message */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1">
          Showing {startIndex} to {endIndex} of {filteredProjects.length} results
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
