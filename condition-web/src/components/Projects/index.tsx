import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DocumentType, DocumentTypeModel } from "@/models/Document";
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
import { theme } from "@/styles/theme";
import { CustomTooltip } from '../Shared/Common';
import { Project } from "./Project";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { Navigate } from "@tanstack/react-router";
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useCreateAmendment } from "@/hooks/api/useAmendments";
import { useCreateDocument, useLoadDocumentsByProject } from "@/hooks/api/useDocuments";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { CreateAmendmentModel } from "@/models/Amendment";
import { CreateDocumentModel, DocumentModel } from "@/models/Document";
import { useQueryClient } from "@tanstack/react-query";
import { DocumentTypes } from "@/utils/enums"


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
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [documentLabel, setDocumentLabel] = useState("");
  const [documentLink, setDocumentLink] = useState("");
  const [dateIssued, setDateIssued] = useState<Date | null>(null);
  const [errors] = useState({
    documentLabel: false,
    dateIssued: false,
  });

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
    setSelectedDocumentId(null);
    setDocumentLabel("");
    setDocumentLink("");
    setDateIssued(null);
  }
  const handleCancelCreateNewDocument = () => {
    setSelectedProject(null);
    setSelectedDocumentType(null);
    setSelectedDocumentId(null);
    setDocumentLabel("");
    setDocumentLink("");
    setDateIssued(null);
  }

  const filteredDocumentTypes = documentType.filter((type) => {
    if (!selectedProject || !selectedProject.documents) return true;

    const hasCertificate = selectedProject.documents.some((document) =>
      document.document_types.includes(DocumentType.Certificate)
    );

    const hasExemptionOrder = selectedProject.documents.some((document) =>
      document.document_types.includes(DocumentType.ExemptionOrder)
    );

    if (type.document_type === DocumentType.Certificate) {
      return !hasExemptionOrder; // Exclude Certificate if ExemptionOrder is present
    }

    if (type.document_type === DocumentType.ExemptionOrder) {
      return !hasCertificate; // Exclude ExemptionOrder if Certificate is present
    }

    return true;
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

  const { mutateAsync: createAmendment } = useCreateAmendment(
    selectedDocumentId ? selectedDocumentId : "",
    {
      onSuccess: onCreateSuccess,
      onError: onCreateFailure,
    }
  );

  const handleCreateNewDocument = async () => {
    const formattedDateIssued = dateIssued 
    ? new Date(dateIssued).toISOString().split("T")[0]
    : undefined;

    const isAmendment = selectedDocumentType === DocumentTypes.Amendment && selectedDocumentId !== null;

    const data = isAmendment
      ? {
          amendment_name: documentLabel,
          amendment_link: documentLink,
          date_issued: formattedDateIssued,
        }
      : {
          document_label: documentLabel,
          document_link: documentLink,
          document_type_id: selectedDocumentType,
          date_issued: formattedDateIssued,
        };


        const response = isAmendment
        ? await createAmendment(data as CreateAmendmentModel)
        : await createDocument(data as CreateDocumentModel);
      
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      
      if (response) {
        const navigateTo = isAmendment
          ? `/conditions/project/${selectedProject?.project_id}/document/${response.amended_document_id}`
          : `/conditions/project/${response.project_id}/document/${response.document_id}`;
      
        navigate({ to: navigateTo });
      }
  };

  const {
    data: documentData,
    isPending: isDocumentsLoading
  } = useLoadDocumentsByProject(
    selectedDocumentType === DocumentTypes.Amendment,
    selectedProject?.project_id
  );

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
            <Typography variant="h6">Add Document</Typography>
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
                Which Project does this Document belong to?
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
                What is the source Document?
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
              {/* Amended document Selector */}
              {selectedDocumentType === DocumentTypes.Amendment && !isDocumentsLoading && (
                <>
                  <Typography variant="body1">
                    Which Certificate Document does this Amendment belong to?
                  </Typography>
                <Autocomplete
                  id="document-selector"
                  options={(documentData || []) as DocumentModel[]}
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
                  getOptionLabel={(document: DocumentModel) => document.document_label}
                  onChange={(_e: React.SyntheticEvent<Element, Event>, document: DocumentModel | null) => {
                    setSelectedDocumentId(document?.document_record_id || null);
                  }}
                  disabled={!selectedProject}
                />
              </>
              )}
              {/* Document Name Field */}
              <Stack direction={"row"} sx={{ width: "100%" }}>
                <Typography variant="body1">Document Label</Typography>
                <CustomTooltip
                  disableInteractive
                  title={
                    <>
                      This is how the document will be titled in the Condition Repository. <br />
                      Note: You do not need to use the official name of the document.
                    </>
                  }
                  placement="top"
                  arrow
                >
                  <HelpIcon
                    fontSize="small"
                    sx={{
                      marginTop: '3px',
                      marginLeft: '5px',
                      color: theme.palette.primary?.main
                    }}
                  />
                </CustomTooltip>
              </Stack>
              <TextField
                value={documentLabel}
                onChange={(e) => setDocumentLabel(e.target.value)}
                error={errors.documentLabel}
                helperText={errors.documentLabel && "Document label is required"}
                fullWidth
                placeholder="Document Label"
                size="small"
                disabled={
                  !selectedProject || (
                    selectedDocumentType === DocumentTypes.Amendment && !selectedDocumentId?.trim()
                  )
                }
              />
              {/* Document Link Field */}
              <Stack direction={"row"} sx={{ width: "100%" }}>
                <Typography variant="body1">Link to Document</Typography>
                <CustomTooltip
                  disableInteractive
                  title={'This is to include the URL to the document in EPIC.'}
                  placement="top"
                  arrow
                >
                  <HelpIcon
                    fontSize="small"
                    sx={{
                      marginTop: '3px',
                      marginLeft: '5px',
                      color: theme.palette.primary?.main
                    }}
                  />
                </CustomTooltip>
              </Stack>
              <TextField
                value={documentLink}
                onChange={(e) => setDocumentLink(e.target.value)}
                fullWidth
                placeholder="Link to Document"
                size="small"
                disabled={
                  !selectedProject || (
                    selectedDocumentType === DocumentTypes.Amendment && !selectedDocumentId?.trim()
                  )
                }
              />
              {/* Date Issued Field */}
              <Stack direction={"row"} sx={{ width: "100%" }}>
                <Typography variant="body1">Date Issued</Typography>
                <CustomTooltip
                  disableInteractive
                  title={
                    <>
                      This is the year that the document was officially signed/approved. <br />
                      Note: Please ensure you do not input the date that it was published to EPIC.
                    </>
                  }
                  placement="top"
                  arrow
                >
                  <HelpIcon
                    fontSize="small"
                    sx={{
                      marginTop: '3px',
                      marginLeft: '5px',
                      color: theme.palette.primary?.main
                    }}
                  />
                </CustomTooltip>
              </Stack>
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
                  disabled={
                    !selectedProject || (
                      selectedDocumentType === DocumentTypes.Amendment && !selectedDocumentId?.trim()
                    )
                  }
                />
              </LocalizationProvider>
            </Stack>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
            <Button
              variant="outlined"
              sx={{ minWidth: "100px" }}
              onClick={handleCancelCreateNewDocument}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ marginLeft: "8px", minWidth: "100px" }}
              onClick={handleCreateNewDocument}
            >
              Add
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
