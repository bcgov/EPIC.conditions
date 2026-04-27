import React, { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "@tanstack/react-router";
import { ExtractionPreviewModal } from "./ExtractionPreviewModal";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetAllProjects } from "@/hooks/api/useProjects";
import {
  ExtractionRequest,
  useGetExtractionRequests,
  useImportExtractionRequest,
  useRejectExtractionRequest,
} from "@/hooks/api/useExtractionRequests";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";

// ---------- Design tokens --------------------------------------------------
// Centralizing all colours here avoids magic strings scattered through JSX.
const colors = {
  primary: "#003366",
  primaryDark: "#002244",
  primaryHover: "rgba(0, 51, 102, 0.04)",

  // Section header
  sectionHeaderBg: "rgba(0, 51, 102, 0.04)",
  sectionHeaderText: "#003366",
  sectionHeaderChevron: "#003366",

  // Extraction complete – success
  successBorder: "#C8E6C9",
  successBg: "#FFFFFF",
  successText: "#2E7D32",

  // Extraction complete – failed
  errorBorder: "#FFCDD2",
  errorBg: "#FFFFFF",
  errorText: "#C62828",

  // Extraction in progress
  pendingBorder: "#E0E0E0",
  pendingBg: "#FFFFFF",
  pendingText: "#5F6368",
  pendingAccent: "#5F7F68",

  // Archive
  archiveBg: "#FFFFFF",
  archiveBorder: "#E0E0E0",
  archiveHeaderBg: "#FAFAFA",
  archiveDateText: "#666",

  // Generic
  bodyText: "#333",
  divider: "#E0E0E0",
  buttonBg: "white",
  buttonHoverBg: "#F5F5F5",
  buttonHoverBorder: "#CCC",
};
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}

/** Static header bar rendered at the top of each section panel. */
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, expanded, onToggle }) => (
  <Box
    onClick={onToggle}
    sx={{
      backgroundColor: colors.sectionHeaderBg,
      px: 2,
      py: 1.5,
      borderBottom: `1px solid ${colors.divider}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
    }}
  >
    <Typography variant="subtitle2" fontWeight="bold" color={colors.sectionHeaderText}>
      {title}
    </Typography>
    {expanded ? (
      <ExpandLessIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
    ) : (
      <ExpandMoreIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
    )}
  </Box>
);

export default function ExtractedDocumentsPage() {
  const { replaceBreadcrumb } = useBreadCrumb();
  const navigate = useNavigate();
  const { data: requests, isLoading, error } = useGetExtractionRequests();
  const { data: projects = [] } = useGetAllProjects();
  const importMutation = useImportExtractionRequest();
  const rejectMutation = useRejectExtractionRequest();

  const [previewRequest, setPreviewRequest] = useState<ExtractionRequest | null>(null);
  const [stopRequest, setStopRequest] = useState<ExtractionRequest | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState({
    complete: true,
    progress: true,
    archive: true,
  });

  useEffect(() => {
    replaceBreadcrumb("Extracted Documents", "Extracted Documents", "/extracted-documents", true);
  }, [replaceBreadcrumb]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return error.response?.data?.message ?? fallback;
    }
    return fallback;
  };

  // Only toast once when the query fails, not on every render.
  useEffect(() => {
    if (error) notify.error("Failed to load extraction requests");
  }, [error]);

  const handleImport = (id: number) => {
    importMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Conditions imported successfully!");
        setPreviewRequest(null);
      },
      onError: (error: unknown) =>
        notify.error(getErrorMessage(error, "Failed to import conditions")),
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Extraction rejected successfully!");
        setPreviewRequest(null);
        setStopRequest(null);
      },
      onError: (error: unknown) =>
        notify.error(getErrorMessage(error, "Failed to reject extraction")),
    });
  };

  const getDocumentName = (req: ExtractionRequest) =>
    req.original_file_name || req.s3_url?.split("/").pop() || req.document_label || `Document ${req.document_id}`;

  const getProjectName = (req: ExtractionRequest) =>
    projects.find((project) => project.project_id === req.project_id)?.project_name ?? req.project_id;

  const formatFileSize = (fileSizeBytes?: number | null) => {
    if (!fileSizeBytes || fileSizeBytes <= 0) {
      return null;
    }

    return `${(fileSizeBytes / 1024).toFixed(1)} KB`;
  };

  const formatName = (name: string | undefined | null) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      const lastName = parts.pop();
      return `${lastName}, ${parts.join(" ")}`;
    }
    return name;
  };

  const renderStaffAttribution = (req: ExtractionRequest) => {
    const uploadedBy = formatName(req.uploaded_by_name);
    const importedBy = formatName(req.imported_by_name);

    if (!uploadedBy && !importedBy) return null;

    return (
      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.25 }}>
        {uploadedBy && importedBy && uploadedBy === importedBy ? (
          <>Uploaded & Imported by: <strong>{uploadedBy}</strong></>
        ) : uploadedBy && importedBy ? (
          <>Uploaded by: <strong>{uploadedBy}</strong> • Imported by: <strong>{importedBy}</strong></>
        ) : uploadedBy ? (
          <>Uploaded by: <strong>{uploadedBy}</strong></>
        ) : null}
      </Typography>
    );
  };

  const completedRequests =
    requests?.filter((r) => r.status === "completed" || r.status === "failed") ?? [];
  const pendingRequests = requests?.filter((r) => r.status === "pending" || r.status === "processing") ?? [];
  const archivedRequests =
    requests?.filter((r) => r.status === "imported") ?? [];

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <PageGrid>
      <ExtractionPreviewModal
        open={!!previewRequest}
        onClose={() => setPreviewRequest(null)}
        extractionRequest={previewRequest}
        onImport={handleImport}
        onReject={handleReject}
        isImporting={importMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />
      <Dialog
        open={!!stopRequest}
        onClose={() => setStopRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            Stop Extraction?
          </Typography>
          <IconButton onClick={() => setStopRequest(null)} aria-label="Close" disabled={rejectMutation.isPending}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography color="error" fontSize="1.1rem">
            This will stop the extraction process for {stopRequest ? getDocumentName(stopRequest) : "this document"}.
          </Typography>
          <Typography color="error" fontSize="1.1rem">
            Are you sure you wish to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStopRequest(null)} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => stopRequest && handleReject(stopRequest.id)}
            disabled={rejectMutation.isPending}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Page header */}
      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" color={colors.primary}>
          Extracted Documents
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate({ to: "/documents/extract" })}
          sx={{ backgroundColor: colors.primary, textTransform: "none", borderRadius: 2 }}
        >
          + Add/Extract Document
        </Button>
      </Grid>

      <Grid item xs={12}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={4}>

            {/* ── Ready for Review ─────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Ready for Review"
                expanded={sectionsOpen.complete}
                onToggle={() => toggleSection("complete")}
              />
              {sectionsOpen.complete && <Box p={2} display="flex" flexDirection="column" gap={2}>
                {completedRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                    No recent extractions are ready for review.
                  </Typography>
                ) : (
                  completedRequests.map((req) => {
                    const isSuccess = req.status === "completed";
                    const conditionCount = req.extracted_data?.conditions?.length ?? 0;
                    return (
                      <Box
                        key={req.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          borderRadius: 1,
                          border: `1px solid ${isSuccess ? colors.successBorder : colors.errorBorder}`,
                          backgroundColor: isSuccess ? colors.successBg : colors.errorBg,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Document label */}
                        <Box flex={1}>
                          <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText}>
                            {getDocumentName(req)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
                            <Typography variant="caption" color="textSecondary">
                              {getProjectName(req)}
                            </Typography>
                            {formatFileSize(req.file_size_bytes) && (
                              <>
                                <Typography variant="caption" color="textSecondary">•</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatFileSize(req.file_size_bytes)}
                                </Typography>
                              </>
                            )}
                          </Box>
                          {renderStaffAttribution(req)}
                        </Box>

                        {/* Status indicator */}
                        <Box flex={1} display="flex" alignItems="center" gap={1}>
                          {isSuccess ? (
                            <CheckCircleOutlineIcon color="success" />
                          ) : (
                            <ErrorOutlineIcon color="error" />
                          )}
                          <Box>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              color={isSuccess ? colors.successText : colors.errorText}
                            >
                              {isSuccess ? "Ready to Review" : "Extraction Failed"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
                              {isSuccess
                                ? `Successfully extracted ${conditionCount} condition${conditionCount !== 1 ? "s" : ""} from ${getDocumentName(req)}.`
                                : req.error_message || "Unable to extract conditions. The file may be corrupted, scanned as an image, or in an unsupported format."}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Action */}
                        <Box flex={0.5} display="flex" justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ChevronRightIcon />}
                            onClick={() =>
                              isSuccess
                                ? setPreviewRequest(req)
                                : navigate({
                                  to: "/documents/extract",
                                  search: {
                                    manualEntry: true,
                                    projectId: req.project_id,
                                    documentTypeId: req.document_type_id,
                                    documentLabel: req.document_label,
                                  },
                                })
                            }
                            sx={{
                              textTransform: "none",
                              backgroundColor: colors.buttonBg,
                              color: colors.bodyText,
                              borderColor: colors.divider,
                              "&:hover": {
                                backgroundColor: colors.buttonHoverBg,
                                borderColor: colors.buttonHoverBorder,
                              },
                            }}
                          >
                            {isSuccess ? "Preview & Import Conditions" : "Switch to Manual Entry"}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>}
            </Paper>

            {/* ── Extraction In Progress ────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Extraction In Progress"
                expanded={sectionsOpen.progress}
                onToggle={() => toggleSection("progress")}
              />
              {sectionsOpen.progress && <Box p={2} display="flex" flexDirection="column" gap={2}>
                {pendingRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                    No extractions currently in progress.
                  </Typography>
                ) : (
                  pendingRequests.map((req) => (
                    <Box
                      key={req.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 1,
                        border: `1px solid ${colors.pendingBorder}`,
                        backgroundColor: colors.pendingBg,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      }}
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText}>
                          {getDocumentName(req)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {getProjectName(req)}
                          </Typography>
                          {formatFileSize(req.file_size_bytes) && (
                            <>
                              <Typography variant="caption" color="textSecondary">•</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatFileSize(req.file_size_bytes)}
                              </Typography>
                            </>
                          )}
                        </Box>
                        {renderStaffAttribution(req)}
                      </Box>
                      <Box
                        flex={0.8}
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                        gap={1}
                        px={2}
                      >
                        <CircularProgress
                          size={16}
                          thickness={4}
                          sx={{
                            color: colors.pendingAccent,
                          }}
                        />
                        <Typography variant="body2" color={colors.pendingText}>
                          {req.status === "processing" ? "Processing" : "Queued"}
                        </Typography>
                      </Box>
                      <Box flex={0.2} display="flex" justifyContent="flex-end">
                        <IconButton
                          size="small"
                          aria-label="Cancel extraction"
                          onClick={() => setStopRequest(req)}
                        >
                          <CloseIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>}
            </Paper>

            {/* ── Import History ───────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Import History"
                expanded={sectionsOpen.archive}
                onToggle={() => toggleSection("archive")}
              />
              {sectionsOpen.archive && <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  px={4}
                  py={1}
                  borderBottom={`1px solid ${colors.divider}`}
                  sx={{ backgroundColor: colors.archiveHeaderBg }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Document Name
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Imported On
                  </Typography>
                </Box>
                <Box p={2} display="flex" flexDirection="column" gap={1}>
                  {archivedRequests.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                      No imported documents yet.
                    </Typography>
                  ) : (
                    archivedRequests.map((req) => (
                      <Box
                        key={req.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          borderRadius: 1,
                          backgroundColor: colors.archiveBg,
                          border: `1px solid ${colors.archiveBorder}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText}>
                            {getDocumentName(req)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={0.5}>
                            <Typography variant="caption" color="textSecondary">
                              {getProjectName(req)}
                            </Typography>
                            {formatFileSize(req.file_size_bytes) && (
                              <>
                                <Typography variant="caption" color="textSecondary">•</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatFileSize(req.file_size_bytes)}
                                </Typography>
                              </>
                            )}
                          </Box>
                          {renderStaffAttribution(req)}
                        </Box>
                        <Typography variant="body2" color={colors.archiveDateText}>
                          {new Date(req.updated_date || req.created_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>}
            </Paper>

          </Box>
        )}
      </Grid>
    </PageGrid>
  );
}
