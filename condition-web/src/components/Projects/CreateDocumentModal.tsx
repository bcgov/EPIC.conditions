import { useState } from "react";
import {
    Autocomplete,
    Modal,
    Paper,
    Box,
    Divider,
    IconButton,
    TextField,
    Button,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack
} from "@mui/material";
import { theme } from "@/styles/theme";
import CloseIcon from "@mui/icons-material/Close";
import HelpIcon from '@mui/icons-material/Help';
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DocumentType, DocumentTypeModel } from "@/models/Document";
import { ProjectModel } from "@/models/Project";
import { DocumentTypes } from "@/utils/enums"
import { useCreateDocument, useLoadDocumentsByProject } from "@/hooks/api/useDocuments";
import { useCreateAmendment } from "@/hooks/api/useAmendments";
import { CreateAmendmentModel } from "@/models/Amendment";
import { CreateDocumentModel, DocumentModel } from "@/models/Document";
import { CustomTooltip } from '../Shared/Common';
import { useNavigate } from "@tanstack/react-router";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useQueryClient } from "@tanstack/react-query";
import LoadingButton from "../Shared/Buttons/LoadingButton";

type CreateDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  documentType: DocumentTypeModel[];
  projectArray: ProjectModel[];
  onTransitionEnd?: () => void;
};

export const CreateDocumentModal = ({
  open,
  onClose,
  documentType,
  projectArray,
  onTransitionEnd,
}: CreateDocumentModalProps) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [formState, setFormState] = useState({
        selectedProject: null as ProjectModel | null,
        selectedDocumentType: null as number | null,
        selectedDocumentId: null as string | null,
        selectedDocumentLabel: null as string | null,
        documentLabel: "",
        documentLink: "",
        dateIssued: null as Date | null,
        isLatestAmendment: false,
    });
    
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const updateFormState = (updates: Partial<typeof formState>) => {
        setFormState((prev) => ({ ...prev, ...updates }));
    };

    const resetErrors = () => {
        setErrors({
            selectedProject: false,
            selectedDocumentType: false,
            documentLabel: false,
            dateIssued: false,
        });
    };

    const validateFields = () => {
        const newErrors = {
            selectedProject: !formState.selectedProject,
            selectedDocumentType: !formState.selectedDocumentType,
            documentLabel: !formState.documentLabel.trim(),
            dateIssued: !formState.dateIssued,
        };
        setErrors(newErrors);

        return !Object.values(newErrors).includes(true);
    };

    const filteredDocumentTypes = documentType.filter((type) => {
        if (!formState.selectedProject || !formState.selectedProject.documents) return true;
    
        const hasCertificate = formState.selectedProject.documents.some((document) =>
          document.document_types.includes(DocumentType.Certificate)
        );
    
        const hasExemptionOrder = formState.selectedProject.documents.some((document) =>
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

    const {
        data: documentData,
        isPending: isDocumentsLoading
    } = useLoadDocumentsByProject(
        formState.selectedDocumentType === DocumentTypes.Amendment,
        formState.selectedProject?.project_id
    );

    // Function to get the document name
    const getDocumentName = (type: DocumentTypes | null): string => {
        switch (type) {
        case DocumentTypes.Certificate:
            return "Certificate";
        case DocumentTypes.ExemptionOrder:
            return "Exemption Order";
        default:
            return ""; // Default name if no matching type
        }
    };

    const onCreateFailure = () => {
        notify.error("Failed to create document");
    };
    
    const onCreateSuccess = () => {
        notify.success("Document created successfully");
    };

    const { mutateAsync: createDocument } = useCreateDocument(
        formState.selectedProject?.project_id,
        {
          onSuccess: onCreateSuccess,
          onError: onCreateFailure,
        }
    );

    const { mutateAsync: createAmendment } = useCreateAmendment(
        formState.selectedDocumentId ? formState.selectedDocumentId : "",
        {
            onSuccess: onCreateSuccess,
            onError: onCreateFailure,
        }
    );

    const [loading, setLoading] = useState(false);
    const handleCreateNewDocument = async () => {
        if (!validateFields()) {
            return; // Stop execution if validation fails
        }

        setLoading(true);

        const formattedDateIssued = formState.dateIssued 
        ? formState.dateIssued.toISOString().split("T")[0] : undefined;
    
        const isAmendment = formState.selectedDocumentType === DocumentTypes.Amendment
        && formState.selectedDocumentId;
    
        updateFormState({
            isLatestAmendment: formState.selectedDocumentType === DocumentTypes.OtherOrder,
        });        
    
        const payload = isAmendment
        ? {
            amendment_name: formState.documentLabel,
            amendment_link: formState.documentLink,
            date_issued: formattedDateIssued,
            is_latest_amendment_added: formState.isLatestAmendment,
        }
        : {
            document_label: formState.documentLabel,
            document_link: formState.documentLink,
            document_type_id: formState.selectedDocumentType,
            date_issued: formattedDateIssued,
            is_latest_amendment_added: formState.isLatestAmendment,
        };
    
        try {
            const response = isAmendment
            ? await createAmendment(payload as CreateAmendmentModel)
            : await createDocument(payload as CreateDocumentModel);
            
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            
            if (response) {
                const navigateTo = isAmendment
                    ? `/conditions/project/${formState.selectedProject?.project_id}/document/${response.amended_document_id}`
                    : `/conditions/project/${response.project_id}/document/${response.document_id}`;
            
                navigate({ to: navigateTo });
            }
        } catch (error) {
            console.error("Failed to create document", error);
        } finally {
            setLoading(false); // Stop loading once the request completes
        }
    };

    const resetForm = () => {
        setFormState({
            selectedProject: null,
            selectedDocumentType: null,
            selectedDocumentId: null,
            selectedDocumentLabel: null,
            documentLabel: "",
            documentLink: "",
            dateIssued: null,
            isLatestAmendment: false,
        });
        setErrors({});
    };

    return (
        <Modal open={open} onClose={onClose} onTransitionEnd={onTransitionEnd}>
            <Paper
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "90%",
                    maxWidth: "550px",
                    maxHeight: "90vh",
                    borderRadius: "4px",
                    outline: "none",
                    overflow: "auto",
                }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    padding={"14px 5px 14px 14px"}
                >
                    <Typography variant="h6">Add Document</Typography>
                    <IconButton
                        onClick={() => {
                            resetForm();
                            resetErrors();
                            onClose();
                        }}
                    >
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
                            value={formState.selectedProject}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label=" "
                                    InputLabelProps={{ shrink: false }}
                                    fullWidth
                                    error={errors.selectedProject}
                                    helperText={errors.selectedProject ? "Please select a project" : ""}
                                />
                            )}
                            size="small"
                            getOptionLabel={(project: ProjectModel) => project.project_name}
                            onChange={(_e, project) => {
                                updateFormState({ selectedProject: project });
                                setErrors((prev) => ({ ...prev, selectedProject: false }));
                            }}
                        />
                        {/* Document Type Selector */}
                        <Typography variant="body1">
                            What type of document are you adding?
                        </Typography>
                        <Autocomplete
                            id="document-type-selector"
                            options={filteredDocumentTypes || []}
                            value={filteredDocumentTypes.find(
                                (type) => type.id === formState.selectedDocumentType) || null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label=" "
                                    InputLabelProps={{ shrink: false }}
                                    fullWidth
                                    error={errors.selectedDocumentType}
                                    helperText={errors.selectedDocumentType ? "Please select a document type" : ""}
                                />
                            )}
                            size="small"
                            getOptionLabel={(type: DocumentTypeModel) => type.document_type}
                            onChange={(_e, type) => {
                                updateFormState({ selectedDocumentType: type?.id || null });
                                setErrors((prev) => ({ ...prev, selectedDocumentType: false }));
                            }}
                            disabled={!formState.selectedProject}
                        />
                        {/* Amended document Selector */}
                        {formState.selectedDocumentType === DocumentTypes.Amendment && !isDocumentsLoading && (
                            <>
                                <Typography variant="body1">
                                    Document being amended
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
                                    updateFormState({ selectedDocumentId: document?.document_record_id || null });
                                    updateFormState({ selectedDocumentLabel: document?.document_label || null });
                                }}
                                disabled={!formState.selectedProject}
                                />
                            </>
                        )}
                        {formState.selectedDocumentType !== DocumentTypes.Amendment
                        && formState.selectedDocumentType !== DocumentTypes.OtherOrder
                        && formState.selectedDocumentType !== null && (
                            <>
                                <Typography variant="body1">
                                    Does this {getDocumentName(formState.selectedDocumentType)} document contain amendment(s)?
                                </Typography>
                                <RadioGroup
                                    row
                                    name="isLatestAmendment"
                                    value={formState.isLatestAmendment?.toString()} // Convert boolean to string
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateFormState({ isLatestAmendment: e.target.value === "true" }) // Convert string back to boolean
                                    }
                                    sx={{ marginBottom: '20px' }}
                                >
                                    <FormControlLabel
                                        value="true" // Keep as string
                                        control={<Radio />}
                                        label={`Yes, this ${getDocumentName(formState.selectedDocumentType)} document contains amendment(s)`}
                                    />
                                    <FormControlLabel
                                        value="false" // Keep as string
                                        control={<Radio />}
                                        label={`No, this ${getDocumentName(formState.selectedDocumentType)} document does not contain amendment(s)`}
                                    />
                                </RadioGroup>
                            </>
                        )}
                        {formState.selectedDocumentType === DocumentTypes.Amendment
                        && formState.selectedDocumentId !== null && (
                            <>
                            <Typography variant="body1">
                                Is this the most recent Amendment to {formState.selectedDocumentLabel}?
                            </Typography>
                            <RadioGroup
                                row
                                name="isLatestAmendment"
                                value={formState.isLatestAmendment?.toString()}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    updateFormState({ isLatestAmendment: e.target.value === "true" })
                                }
                                sx={{ marginBottom: '20px' }}
                            >
                                <FormControlLabel
                                    value="true"
                                    control={<Radio />}
                                    label="Yes, this is the most recent Amendment"
                                />
                                <FormControlLabel
                                    value="false"
                                    control={<Radio />}
                                    label="No, this is not the most recent Amendment"
                                />
                            </RadioGroup>
                            </>
                        )}
                        {/* Document Name Field */}
                        <Stack direction={"row"} sx={{ width: "100%" }}>
                            <Typography variant="body1">Document label</Typography>
                            <CustomTooltip
                                disableInteractive
                                title={
                                    <>
                                    This is how the document will be titled in the condition repository. <br />
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
                            value={formState.documentLabel}
                            onChange={(e) => {
                                updateFormState({ documentLabel: e.target.value });
                                setErrors((prev) => ({ ...prev, documentLabel: false }));
                            }}
                            error={errors.documentLabel}
                            helperText={errors.documentLabel ? "Please enter a document label" : ""}
                            fullWidth
                            placeholder="Document label"
                            size="small"
                            disabled={
                                !formState.selectedProject || (
                                    formState.selectedDocumentType === DocumentTypes.Amendment
                                    && !formState.selectedDocumentId?.trim()
                                )
                            }
                        />
                        {/* Date Issued Field */}
                        <Stack direction={"row"} sx={{ width: "100%" }}>
                            <Typography variant="body1">Date issued</Typography>
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
                            value={formState.dateIssued}
                            onChange={(newDate) => {
                                updateFormState({ dateIssued: newDate })
                                setErrors((prev) => ({ ...prev, dateIssued: false }));
                            }}
                            inputFormat="MM/DD/YYYY"
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={errors.dateIssued}
                                    helperText={errors.dateIssued ? "Please enter a date issued" : ""}
                                    fullWidth
                                    size="small"
                                />
                            )}
                            disabled={
                                !formState.selectedProject || (
                                    formState.selectedDocumentType === DocumentTypes.Amendment
                                    && !formState.selectedDocumentId?.trim()
                                )
                            }
                            />
                        </LocalizationProvider>
                        {/* Document Link Field */}
                        <Stack direction={"row"} sx={{ width: "100%" }}>
                            <Typography variant="body1">Link to document</Typography>
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
                            value={formState.documentLink}
                            onChange={(e) => updateFormState({ documentLink: e.target.value })}
                            fullWidth
                            placeholder="Link to document"
                            size="small"
                            disabled={
                            !formState.selectedProject || (
                                formState.selectedDocumentType === DocumentTypes.Amendment
                                && !formState.selectedDocumentId?.trim()
                            )
                            }
                        />
                    </Stack>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
                    <Button
                        variant="outlined"
                        sx={{ minWidth: "100px" }}
                        onClick={resetForm}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        variant="contained"
                        sx={{ marginLeft: "8px", minWidth: "100px" }}
                        onClick={handleCreateNewDocument}
                        loading={loading}
                    >
                        Add
                    </LoadingButton>
                </Box>
            </Paper>
        </Modal>
    );
};
