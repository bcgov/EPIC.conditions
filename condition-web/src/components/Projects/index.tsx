import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DocumentTypeModel } from "@/models/Document";
import { ProjectModel } from "@/models/Project";
import {
  Autocomplete,
  Button,
  Divider,
  Grid,
  Stack,
  Pagination,
  Typography,
  Box,
  InputAdornment,
  Modal,
  Paper,
  IconButton,
  TextField
} from "@mui/material";
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useCreateDocument } from "@/hooks/api/useDocuments";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { CreateDocumentModel } from "@/models/Document";
import { useQueryClient } from "@tanstack/react-query";


type ProjectsParams = {
  projects?: { projects: ProjectModel[] };
  documentType: DocumentTypeModel[];
};

export const Projects = ({ projects, documentType }: ProjectsParams) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const projectArray = projects?.projects || [];
  const itemsPerPage = 10; // Number of projects per page
  const [page, setPage] = useState(1); // Current page
  const [projectSearch, setProjectSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<number | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [dateIssued, setDateIssued] = useState<Date | null>(null);
  const [errors, setErrors] = useState({
    documentName: false,
    dateIssued: false,
  });

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

  const handleOpenCreateNewDocument = () => setOpenModal(true);
  const handleCloseCreateNewDocument = () => {
    setOpenModal(false);
    setSelectedProject(null);
    setSelectedDocumentType(null);
    setDocumentName("");
    setDateIssued(null);
  }
  const handleCancelCreateNewDocument = () => {
    setSelectedProject(null);
    setSelectedDocumentType(null);
    setDocumentName("");
    setDateIssued(null);
  }

  const filteredDocumentTypes = documentType.filter((type) => {
    if (!selectedProject || !selectedProject.documents) return true;

    const isExcluded = selectedProject.documents.some((document) =>
      document.document_types.includes("Schedule B/Certificate")
    );

    return type.document_type !== "Schedule B/Certificate" || !isExcluded;
  });

  const onCreateFailure = () => {
    notify.error("Failed to create document");
  };
  
  const onCreateSuccess = () => {
    notify.success("Document created successfully");
  };

  const { mutateAsync: createDocument } = useCreateDocument(
    selectedProject?.project_id,
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  const handleCreateNewDocument = async () => {
    const formattedDateIssued = dateIssued 
    ? new Date(dateIssued).toISOString().split("T")[0]
    : undefined;

    const data: CreateDocumentModel = {
      display_name: documentName,
      document_type_id: selectedDocumentType,
      date_issued: formattedDateIssued,
    };

    const response = await createDocument(data);

    queryClient.invalidateQueries({
      queryKey: ["projects"],
    });

    if (response) {
      navigate({
        to: `/conditions/project/${response.project_id}/document/${response.document_id}`,
      });
    }

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
          onClick={handleOpenCreateNewDocument}
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

      <Modal open={openModal} onClose={handleCloseCreateNewDocument}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "500px",
            borderRadius: "4px",
            outline: "none",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={"14px 5px 14px 14px"}
          >
            <Typography variant="h6">Create New Document</Typography>
            <IconButton onClick={handleCloseCreateNewDocument}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={"14px"}
          >
            <Stack direction={"column"} sx={{ width: "100%" }}>

              {/* Project Selector */}
              <Typography variant="body1" marginBottom={"2px"}>
                Which project does this document belong to?
              </Typography>
              <Autocomplete
                id="project-selector"
                options={projectArray || []}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label=" "
                        InputLabelProps={{
                            shrink: false,
                        }}
                        fullWidth
                    />
                )}
                size="small"
                getOptionLabel={(project: ProjectModel) => project.project_name}
                onChange={(_e: React.SyntheticEvent<Element, Event>, project: ProjectModel | null) => {
                  setSelectedProject(project);
                }}
              />
              {/* Document Type Selector */}
              <Typography variant="body1">
                Which document are you creating?
              </Typography>
              <Autocomplete
                id="document-type-selector"
                options={filteredDocumentTypes || []}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label=" "
                        InputLabelProps={{
                            shrink: false,
                        }}
                        fullWidth
                    />
                )}
                size="small"
                getOptionLabel={(type: DocumentTypeModel) => type.document_type}
                onChange={(_e: React.SyntheticEvent<Element, Event>, type: DocumentTypeModel | null) => {
                  setSelectedDocumentType(type?.id || null);
                }}
                disabled={!selectedProject}
              />
              {/* Document Name Field */}
              <Typography variant="body1">Document Name</Typography>
              <TextField
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                error={errors.documentName}
                helperText={errors.documentName && "Document name is required"}
                fullWidth
                placeholder="Enter document name"
                size="small"
                disabled={!selectedProject}
              />
              {/* Date Issued Field */}
              <Typography variant="body1">Date Issued</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dateIssued}
                  onChange={(newDate) => setDateIssued(newDate)}
                  inputFormat="MM/DD/YYYY"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={errors.dateIssued}
                      helperText={errors.dateIssued && "Date issued is required"}
                      fullWidth
                      size="small"
                    />
                  )}
                  disabled={!selectedProject}
                />
              </LocalizationProvider>
            </Stack>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
            <Button variant="outlined" onClick={handleCancelCreateNewDocument}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ marginLeft: "8px" }}
              onClick={handleCreateNewDocument}
            >
              Create
            </Button>
          </Box>
        </Paper>
      </Modal>
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
