import { useState } from "react";
import { DocumentTypeModel } from "@/models/Document";
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
  TextField,
} from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { usePagination } from "@/hooks/api/usePagination";
import { CreateDocumentModal } from "./CreateDocumentModal";

type ProjectsParams = {
  projects?: ProjectModel[];
  documentType: DocumentTypeModel[];
};

export const Projects = ({ projects, documentType }: ProjectsParams) => {
  const projectArray = projects || [];
  const itemsPerPage = 10; // Number of projects per page
  const [projectSearch, setProjectSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const filteredProjects = projectArray?.filter(project =>
    project.project_name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const { currentPageItems, totalPages, currentPage, setPage } = usePagination(filteredProjects, itemsPerPage);

  const handleOpenCreateNewDocument = () => setOpenModal(true);

  const handleCloseCreateNewDocument = () => {
    setOpenModal(false);
  }

  if (!projects) return <Navigate to={"/error"} />;

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
          color={"#255A90"}
          fontWeight={"bold"}
        >
          <IconButton sx={{ color: "#255A90" }}>
            <TuneIcon />
          </IconButton>
          Open Filters
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
            width: "30%",
            height: "70%",
            borderRadius: "4px",
            paddingLeft: "2px"
          }}
          onClick={handleOpenCreateNewDocument}
        >
          <AddIcon fontSize="small" /> Add Document
        </Button>
      </Stack>
    </Grid>

      {/* Showing results message */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1">
          Showing {currentPageItems.startIndex + 1} to {currentPageItems.endIndex} of {filteredProjects.length} results
        </Typography>
        {/* Pagination Component */}
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
        <CreateDocumentModal
          open={openModal}
          onClose={handleCloseCreateNewDocument}
          documentType={documentType}
          projectArray={projectArray}
        />
      {currentPageItems.items.map((project) => (
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
