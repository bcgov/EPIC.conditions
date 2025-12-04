import { useState } from "react";
import { DocumentTypeModel } from "@/models/Document";
import { ProjectModel } from "@/models/Project";
import {
  Grid,
  Stack,
  Pagination,
  Typography,
  Box,
  IconButton
} from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import { usePagination } from "@/hooks/api/usePagination";
import { CreateDocumentModal } from "./CreateDocumentModal";
import LoadingButton from "../Shared/Buttons/LoadingButton";
import { SearchFilter } from "../Filters/SearchFilter";

type ProjectsParams = {
  projects?: ProjectModel[];
  documentType: DocumentTypeModel[];
};

export const Projects = ({ projects, documentType }: ProjectsParams) => {
  const projectArray = projects || [];
  const itemsPerPage = 10; // Number of projects per page
  const [projectSearch, setProjectSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [isOpeningModal, setIsOpeningModal] = useState(false);

  const filteredProjects = projectArray?.filter(project =>
    project.project_name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const { currentPageItems, totalPages, currentPage, setPage } = usePagination(filteredProjects, itemsPerPage);

  const handleOpenCreateNewDocument = () => {
    setIsOpeningModal(true); // Set loading state before modal opens
    setOpenModal(true);
  };

  const handleCloseCreateNewDocument = () => {
    setOpenModal(false);
  }

  if (!projects) return <Navigate to={"/error"} />;

  return (
    <Grid container direction={"column"} alignItems="center" spacing={2} >
      <Grid item sx={{ width: '100%' }} >
        <Stack 
          spacing={1} 
          direction={{ xs: "column", sm: "row" }} 
          sx={{ width: "100%", alignItems: "center" }} // Keep items aligned
        >
          {/* Filter Icon and Text */}
          <Box
            display="flex"
            alignItems="center"
            sx={{
              flex: { xs: "auto", sm: "0 0 10%" }, // 10% width on large screens
              minWidth: "150px",
              color: "#255A90",
              fontWeight: "bold",
              whiteSpace: "nowrap" // Prevents wrapping
            }}
          >
            <IconButton sx={{ color: "#255A90" }}>
              <TuneIcon />
            </IconButton>
            Open Filters
          </Box>

          {/* Search Field */}
          <SearchFilter
            searchType="project"
            value={projectSearch}
            onChange={setProjectSearch}
          />

          {/* Spacer to push the button to the right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Add Document Button */}
          <LoadingButton
            variant="contained"
            color="primary"
            size="small"
            sx={{
              flex: { xs: "auto", sm: "0 0 15%" }, // Auto width, no extra space
              width: { xs: "100%", sm: "auto" }, // Full width on mobile, auto on large screens
              height: "70%",
              borderRadius: "4px",
              paddingLeft: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleOpenCreateNewDocument}
            loading={isOpeningModal}
          >
            <AddIcon fontSize="small" /> Add Document
          </LoadingButton>
        </Stack>
      </Grid>
      <Grid item sx={{ width: '100%', marginTop: 1 }} >
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
      </Grid>
      {currentPageItems.items.map((project) => (
        <Grid item key={project.project_id} sx={{ width: '100%' }}>
          <Project project={project} />
        </Grid>
      ))}
      <CreateDocumentModal
          open={openModal}
          onClose={handleCloseCreateNewDocument}
          documentType={documentType}
          projectArray={projectArray}
          onTransitionEnd={() => setIsOpeningModal(false)}
        />
    </Grid>
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
