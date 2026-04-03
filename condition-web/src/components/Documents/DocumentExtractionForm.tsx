import { useCallback, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useDropzone } from "react-dropzone";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { BCDesignTokens } from "epic.theme";
import { DocumentLabelModel, DocumentTypeModel } from "@/models/Document";
import { AvailableProjectModel } from "@/models/Project";
import { useGetAllProjects } from "@/hooks/api/useProjects";
import { useGetDocumentLabels } from "@/hooks/api/useDocuments";
import { S3_FOLDER, useUploadDocument } from "@/hooks/api/useObjectStorage";
import { useCreateExtractionRequest } from "@/hooks/api/useExtractionRequests";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { KeycloakRoles, useHasAllowedRoles } from "@/hooks/useAuthorization";

type DocumentExtractionFormProps = {
    documentType: DocumentTypeModel[];
};

export const DocumentExtractionForm = ({
    documentType,
}: DocumentExtractionFormProps) => {
    const canExtract = useHasAllowedRoles([KeycloakRoles.EXTRACT_CONDITIONS, KeycloakRoles.VIEW_CONDITIONS]);
    const { data: projects = [], isPending: isProjectsLoading } = useGetAllProjects();
    const [selectedProject, setSelectedProject] = useState<AvailableProjectModel | null>(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentTypeModel | null>(null);
    const [selectedDisplayName, setSelectedDisplayName] = useState<DocumentLabelModel | null>(null);
    const [showMore, setShowMore] = useState(false);

    const { data: documentLabels = [], isPending: isLabelsLoading } = useGetDocumentLabels(selectedProject?.project_id);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [s3Key, setS3Key] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const uploadDocument = useUploadDocument();
    const createExtractionRequest = useCreateExtractionRequest();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setUploadedFile(acceptedFiles[0]);
        setS3Key(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        maxFiles: 1,
        disabled: !canExtract,
    });

    const handleClear = () => {
        setUploadedFile(null);
        setS3Key(null);
        setUploadSuccess(false);
    };

    const isUploading = uploadDocument.isPending || createExtractionRequest.isPending;
    const canSubmit = canExtract && !!selectedProject && !!selectedDocumentType && !!selectedDisplayName && !!uploadedFile && !isUploading;

    const handleSubmit = () => {
        if (!uploadedFile || !selectedProject) return;
        uploadDocument.mutate(
            { file: uploadedFile, folder: S3_FOLDER.CONDITION_DOCUMENTS.value },
            {
                onSuccess: (s3RelativeUrl) => {
                    setS3Key(s3RelativeUrl);
                    createExtractionRequest.mutate(
                        {
                            project_id: selectedProject.project_id,
                            document_id: selectedDisplayName?.document_id ?? null,
                            document_type_id: selectedDocumentType?.id ?? null,
                            document_label: selectedDisplayName?.document_label ?? null,
                            s3_url: s3RelativeUrl,
                        },
                        {
                            onSuccess: () => {
                                setUploadSuccess(true);
                                setUploadedFile(null);
                                setS3Key(null);
                                setSelectedProject(null);
                                setSelectedDocumentType(null);
                                setSelectedDisplayName(null);
                            },
                            onError: () => notify.error("Document uploaded but failed to register for extraction."),
                        }
                    );
                },
                onError: () => notify.error("File upload to storage failed."),
            }
        );
    };

    return (
        <>
            <Box
                sx={{
                    backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
                    padding: "16px 20px",
                }}
            >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Condition Extractor
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                    Fill in the document details and upload a file to extract document conditions automatically.
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    <strong>Note:</strong> Amendments must be entered manually.
                </Typography>
            </Box>
        <Box padding={"24px"}>
            <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={600}>
                    Required Information
                </Typography>
                <Box>
                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                        Project Name <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Autocomplete
                        options={projects}
                        value={selectedProject}
                        loading={isProjectsLoading}
                        getOptionLabel={(p) => p.project_name}
                        onChange={(_, v) => {
                            setSelectedProject(v);
                            setSelectedDocumentType(null);
                            setSelectedDisplayName(null);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label=" "
                                InputLabelProps={{ shrink: false }}
                                size="small"
                                fullWidth
                            />
                        )}
                    />
                </Box>

                <Box display="flex" gap={2}>
                    <Box flex={1}>
                        <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                            Document Type <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Autocomplete
                            options={documentType.filter((t) =>
                                /certificate|order/i.test(t.document_type)
                            )}
                            value={selectedDocumentType}
                            getOptionLabel={(t) => t.document_type}
                            onChange={(_, v) => setSelectedDocumentType(v)}
                            disabled={!selectedProject}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label=" "
                                    InputLabelProps={{ shrink: false }}
                                    size="small"
                                    fullWidth
                                />
                            )}
                        />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                            Display Name <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Autocomplete
                            options={documentLabels}
                            value={selectedDisplayName}
                            loading={isLabelsLoading}
                            getOptionLabel={(d) => d.document_label ?? ""}
                            onChange={(_, v) => setSelectedDisplayName(v)}
                            disabled={!selectedProject}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label=" "
                                    InputLabelProps={{ shrink: false }}
                                    size="small"
                                    fullWidth
                                />
                            )}
                        />
                    </Box>
                </Box>

                <Box>
                    <Box
                        display="inline-flex"
                        alignItems="center"
                        gap={0.5}
                        onClick={() => setShowMore((prev) => !prev)}
                        sx={{ cursor: "pointer", color: "primary.main" }}
                    >
                        {showMore ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        <Typography variant="body2" color="primary.main">
                            Show more details
                        </Typography>
                    </Box>
                    {showMore && (
                        <Stack spacing={0.25} mt={1}>
                            <Box display="flex" gap={2}>
                                <Box flex={1}>
                                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                                        Project ID
                                    </Typography>
                                    <TextField value={selectedProject?.project_id ?? ""} size="small" disabled fullWidth />
                                </Box>
                                <Box flex={1}>
                                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                                        Document ID
                                    </Typography>
                                    <TextField value={selectedDisplayName?.document_id ?? ""} size="small" disabled fullWidth />
                                </Box>
                            </Box>
                            <Box display="flex" gap={2}>
                                <Box flex={1}>
                                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                                        Date Issued
                                    </Typography>
                                    <TextField value={selectedDisplayName?.date_issued ?? ""} size="small" disabled fullWidth />
                                </Box>
                                <Box flex={1}>
                                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                                        Project Type
                                    </Typography>
                                    <TextField value={selectedDisplayName?.project_type ?? ""} size="small" disabled fullWidth />
                                </Box>
                            </Box>
                            <Box display="flex" gap={2}>
                                <Box flex={1}>
                                    <Typography variant="body2" fontWeight={500} marginBottom={"4px"}>
                                        Act
                                    </Typography>
                                    <TextField value={selectedDisplayName?.act ?? ""} size="small" disabled fullWidth />
                                </Box>
                                <Box flex={1} />
                            </Box>
                        </Stack>
                    )}
                </Box>

                <Box>
                    <Typography variant="body2" fontWeight={500} marginBottom={"8px"}>
                        Upload Document <span style={{ color: "red" }}>*</span>
                    </Typography>

                    {/* Permission warning */}
                    {!canExtract && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                border: "1px solid",
                                borderColor: "warning.light",
                                borderRadius: "8px",
                                padding: "12px 16px",
                                backgroundColor: "warning.50",
                                mb: 1,
                            }}
                        >
                            <LockOutlinedIcon sx={{ color: "warning.main", fontSize: 20 }} />
                            <Typography variant="body2" color="warning.dark">
                                You do not have permission to upload documents. The <strong>extract_conditions</strong> role is required.
                            </Typography>
                        </Box>
                    )}

                    {/* Drop zone — hidden once a file is selected */}
                    {!uploadedFile && (
                        <Box
                            {...getRootProps()}
                            sx={{
                                border: "2px dashed",
                                borderColor: !canExtract ? "grey.200" : isDragActive ? "primary.main" : "grey.300",
                                borderRadius: "8px",
                                padding: "32px 24px",
                                textAlign: "center",
                                cursor: canExtract ? "pointer" : "not-allowed",
                                backgroundColor: !canExtract ? "grey.100" : isDragActive ? "primary.50" : "grey.50",
                                transition: "all 0.2s ease",
                                ...( canExtract && {
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        backgroundColor: "primary.50",
                                    },
                                }),
                            }}
                        >
                            <input {...getInputProps()} />
                            <UploadFileIcon sx={{ fontSize: 36, color: !canExtract ? "grey.300" : isDragActive ? "primary.main" : "grey.400", mb: 1 }} />
                            <Typography variant="body2" fontWeight={500} color={!canExtract ? "text.disabled" : isDragActive ? "primary.main" : "text.primary"}>
                                {isDragActive ? "Release to upload" : "Drag & drop your file here"}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                                or{" "}
                                <span style={{ textDecoration: "underline" }}>
                                    browse to select
                                </span>
                                {" "}— PDF files only
                            </Typography>
                        </Box>
                    )}

                    {/* File card — shown after selection */}
                    {uploadedFile && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                border: "1px solid",
                                borderColor: s3Key ? "success.light" : isUploading ? "primary.light" : "grey.300",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                backgroundColor: s3Key ? "success.50" : isUploading ? "primary.50" : "grey.50",
                                transition: "all 0.3s ease",
                            }}
                        >
                            <InsertDriveFileIcon sx={{ color: s3Key ? "success.main" : isUploading ? "primary.main" : "grey.500", fontSize: 28 }} />
                            <Box flex={1} minWidth={0}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                    {uploadedFile.name}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                                    {isUploading ? (
                                        <>
                                            <CircularProgress size={10} />
                                            <Typography variant="caption" color="primary.main">Uploading…</Typography>
                                        </>
                                    ) : s3Key ? (
                                        <>
                                            <CheckCircleIcon sx={{ fontSize: 12, color: "success.main" }} />
                                            <Typography variant="caption" color="success.main">Upload complete</Typography>
                                        </>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Ready to upload</Typography>
                                    )}
                                </Box>
                            </Box>
                            <Button
                                size="small"
                                variant="text"
                                color="inherit"
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                                sx={{ minWidth: 0, p: 0.5, color: "grey.500", "&:hover": { color: "error.main" } }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </Button>
                        </Box>
                    )}
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button
                        variant="outlined"
                        onClick={handleClear}
                        disabled={!uploadedFile || isUploading || !canExtract}
                    >
                        Clear
                    </Button>
                    <Tooltip
                        title={!canExtract ? "You need the extract_conditions role to upload documents." : ""}
                        placement="top"
                    >
                        <span>
                            <Button
                                variant="contained"
                                disabled={!canSubmit}
                                onClick={handleSubmit}
                                startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <UploadFileIcon />}
                            >
                                {isUploading ? "Uploading…" : "Upload Document"}
                            </Button>
                        </span>
                    </Tooltip>
                </Box>

                {uploadSuccess && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            border: "1px solid",
                            borderColor: BCDesignTokens.supportBorderColorSuccess,
                            borderRadius: "8px",
                            padding: "14px 16px",
                            backgroundColor: BCDesignTokens.supportSurfaceColorSuccess,
                        }}
                    >
                        <CheckCircleOutlineIcon sx={{ color: BCDesignTokens.iconsColorSuccess, mt: 0.25, fontSize: 20 }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                Document successfully submitted for extraction
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, mb: 1.5 }}>
                                Your document will be extracted shortly. Please return to the <strong>Extracted Documents</strong> tab to review and import condition data once the automatic extraction is complete.
                            </Typography>
                            <Box display="flex" gap={1}>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={handleClear}
                                >
                                    Upload Another
                                </Button>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    onClick={() => window.location.href = "/extracted-documents"}
                                >
                                    Go to Extracted Documents
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Stack>
        </Box>
        </>
    );
};
