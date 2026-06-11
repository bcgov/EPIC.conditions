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
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { useNavigate } from "@tanstack/react-router";
import { useHasAllowedRoles, KeycloakRoles } from "@/hooks/useAuthorization";
import { ExtractionPreviewModal } from "./ExtractionPreviewModal";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useGetAllProjects } from "@/hooks/api/useProjects";
import {
  ExtractionRequest,
  UnsupportedCategory,
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
  backgroundColor?: string;
  textColor?: string;
  chevronColor?: string;
}

const unsupportedDisplayText: Record<UnsupportedCategory, { title: string; message: string }> = {
  amendment_document: {
    title: "Amendment Document",
    message: "Amendment documents are not supported for condition extraction.",
  },
  invalid_document: {
    title: "Invalid Document",
    message: "This document is not related to EAO project conditions.",
  },
  unreadable_format: {
    title: "Unreadable Format",
    message: "No readable text was found in this document.",
  },
};

const getUnsupportedDisplayText = (req: ExtractionRequest) => {
  const category = req.extracted_data?.eligibility?.unsupported_category;
  if (category && unsupportedDisplayText[category]) {
    return unsupportedDisplayText[category];
  }
  return unsupportedDisplayText.invalid_document;
};

/** Static header bar rendered at the top of each section panel. */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  expanded,
  onToggle,
  backgroundColor = colors.sectionHeaderBg,
  textColor = colors.sectionHeaderText,
  chevronColor = colors.sectionHeaderChevron,
}) => (
  <Box
    onClick={onToggle}
    sx={{
      backgroundColor,
      px: 2,
      py: 1.5,
      borderBottom: expanded ? `1px solid ${colors.divider}` : "none",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
    }}
  >
    <Typography variant="subtitle2" fontWeight="bold" color={textColor}>
      {title}
    </Typography>
    {expanded ? (
      <ExpandLessIcon fontSize="small" sx={{ color: chevronColor }} />
    ) : (
      <ExpandMoreIcon fontSize="small" sx={{ color: chevronColor }} />
    )}
  </Box>
);

export default function ExtractedDocumentsPage() {
  const { replaceBreadcrumb } = useBreadCrumb();
  const navigate = useNavigate();
  const hasExtractionRole = useHasAllowedRoles([KeycloakRoles.EXTRACT_CONDITIONS]);
  const { data: requests, isLoading, error } = useGetExtractionRequests();
  const { data: projects = [] } = useGetAllProjects();
  const importMutation = useImportExtractionRequest();
  const rejectMutation = useRejectExtractionRequest();

  const [previewRequest, setPreviewRequest] = useState<ExtractionRequest | null>(null);
  const [stopRequest, setStopRequest] = useState<ExtractionRequest | null>(null);
  const [discardRequest, setDiscardRequest] = useState<ExtractionRequest | null>(null);
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

  const handleReject = (id: number, successMessage = "Extraction rejected successfully!") => {
    rejectMutation.mutate(id, {
      onSuccess: () => {
        notify.success(successMessage);
        setPreviewRequest(null);
        setStopRequest(null);
        setDiscardRequest(null);
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
    const importedBy = formatName(req.imported_by_name);

    if (req.status !== "imported" || !importedBy) return null;

    return (
      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.25 }}>
        Imported by: <strong>{importedBy}</strong>
      </Typography>
    );
  };

  const formatEstimatedDuration = (minutes: number | null) => {
    if (!minutes) return "Updating estimate";
    if (minutes <= 1) return "under 1 minute";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
      return `~${hours}h ${remainingMinutes}m`;
    }

    if (hours > 0) {
      return `~${hours} hour${hours === 1 ? "" : "s"}`;
    }

    return `~${minutes} minutes`;
  };

  const getPendingStatusDetails = (req: ExtractionRequest) => {
    if (req.status === "processing") {
      return {
        title: "Processing",
        subtitle: `Estimated time: ${formatEstimatedDuration(
          req.estimated_ready_minutes ?? null
        )}`,
      };
    }

    return {
      title: "Queued",
      subtitle: `Estimated time: ${formatEstimatedDuration(
        req.estimated_wait_minutes ?? null
      )}`,
    };
  };

  const completedRequests =
    requests?.filter((r) => (
      r.status === "completed" ||
      r.status === "failed" ||
      r.status === "unsupported"
    )) ?? [];
  const pendingRequests =
    requests
      ?.filter((r) => r.status === "pending" || r.status === "processing")
      .sort((left, right) => {
        if (left.status === "processing" && right.status !== "processing") {
          return -1;
        }

        if (right.status === "processing" && left.status !== "processing") {
          return 1;
        }

        return (left.queue_position ?? Number.MAX_SAFE_INTEGER) -
          (right.queue_position ?? Number.MAX_SAFE_INTEGER);
      }) ?? [];
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
            This will stop the extraction process for <strong>{stopRequest ? getDocumentName(stopRequest) : "this document"}</strong>.
          </Typography>
          <Typography color="error" fontSize="1.1rem">
            Are you sure you wish to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setStopRequest(null)} disabled={rejectMutation.isPending}>
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

      <Dialog
        open={!!discardRequest}
        onClose={() => setDiscardRequest(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h5" fontWeight="bold">
            Discard File?
          </Typography>
          <IconButton onClick={() => setDiscardRequest(null)} aria-label="Close" disabled={rejectMutation.isPending}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography color="error" fontSize="1.1rem">
            This action will discard <strong>{discardRequest ? getDocumentName(discardRequest) : "this file"}</strong>. Are you sure you wish to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setDiscardRequest(null)} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => discardRequest && handleReject(discardRequest.id, "Extraction discarded successfully!")}
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
        {hasExtractionRole && (
          <Button
            variant="contained"
            onClick={() => navigate({ to: "/documents/extract", search: { manualEntry: false, projectId: undefined, documentTypeId: undefined, documentLabel: undefined, dateIssued: undefined } })}
            sx={{ backgroundColor: colors.primary, textTransform: "none", borderRadius: 2 }}
          >
            + Add/Extract Document
          </Button>
        )}
      </Grid>

      <Grid item xs={12}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap="15px" pb={2}>

            {/* ── Ready for Review ─────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Extraction Complete"
                expanded={sectionsOpen.complete}
                onToggle={() => toggleSection("complete")}
                backgroundColor="#F3FBF4"
                textColor={colors.bodyText}
                chevronColor={colors.bodyText}
              />
              {sectionsOpen.complete && <Box p={2} display="flex" flexDirection="column" gap="15px">
                {completedRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                    No recent extractions are ready for review.
                  </Typography>
                ) : (
                  completedRequests.map((req) => {
                    const isSuccess = req.status === "completed";
                    const isUnsupported = req.status === "unsupported";
                    const conditionCount = req.extracted_data?.conditions?.length ?? 0;
                    const unsupportedText = getUnsupportedDisplayText(req);
                    const statusTitle = isSuccess
                      ? "Extraction Complete!"
                      : isUnsupported
                        ? unsupportedText.title
                        : "Extraction Failed";
                    const statusMessage = isSuccess
                      ? `Successfully extracted ${conditionCount} condition${conditionCount !== 1 ? "s" : ""}.`
                      : isUnsupported
                        ? unsupportedText.message
                        : req.error_message || "Unable to extract conditions. The file may be corrupted, scanned as an image, or in an unsupported format.";

                    return (
                      <Box
                        key={req.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                          gap: { xs: 1.5, md: 0 },
                          alignItems: "center",
                          p: 2,
                          borderRadius: 1,
                          border: `1px solid ${colors.divider}`,
                          backgroundColor: isSuccess ? colors.successBg : colors.errorBg,
                        }}
                      >
                        {/* Document label */}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText} sx={{ wordBreak: "break-word" }}>
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
                        <Box display="flex" alignItems="flex-start" gap={1}>
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
                              {statusTitle}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
                              {statusMessage}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Action */}
                        <Box display="flex" flexDirection="column" gap={1} sx={{ justifySelf: { xs: "start", md: "end" }, alignItems: { xs: "flex-start", md: "flex-end" } }}>
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
                                    documentId: req.document_id,
                                    extractionRequestId: req.id,
                                  },
                                })
                            }
                            sx={{
                              textTransform: "none",
                              whiteSpace: "nowrap",
                              width: "100%",
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
                          {!isSuccess && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setDiscardRequest(req)}
                              sx={{
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                width: "100%",
                                borderRadius: "4px",
                                border: "1px solid #CE3E39",
                                backgroundColor: "#F4E1E2",
                                color: colors.bodyText,
                                fontWeight: "normal",
                                "&:hover": {
                                  backgroundColor: "#F4E1E2",
                                  borderColor: "#CE3E39",
                                },
                              }}
                            >
                              Discard File
                            </Button>
                          )}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>}
            </Paper>

            {/* ── Extraction Queue ───────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Extraction Queue"
                expanded={sectionsOpen.progress}
                onToggle={() => toggleSection("progress")}
                backgroundColor="#FFF9E6"
                textColor={colors.bodyText}
                chevronColor={colors.bodyText}
              />
              {sectionsOpen.progress && <Box p={2} display="flex" flexDirection="column" gap={2}>
                {pendingRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                    No documents are currently queued or processing.
                  </Typography>
                ) : (
                  pendingRequests.map((req) => {
                    const pendingStatus = getPendingStatusDetails(req);

                    return (
                      <Box
                        key={req.id}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                          gap: { xs: 1.5, md: 0 },
                          alignItems: "center",
                          p: 2,
                          borderRadius: 1,
                          border: `1px solid ${colors.pendingBorder}`,
                          backgroundColor: colors.pendingBg,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText} sx={{ wordBreak: "break-word" }}>
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
                          display="flex"
                          alignItems="center"
                          justifyContent="flex-start"
                          gap={1.5}
                        >
                          <ScheduleOutlinedIcon
                            sx={{
                              color: colors.pendingAccent,
                              fontSize: 22,
                            }}
                          />
                          <Box>
                            <Typography variant="body2" color={colors.bodyText} fontWeight="bold">
                              {pendingStatus.title}
                            </Typography>
                            <Typography variant="body2" color={colors.pendingText}>
                              {pendingStatus.subtitle}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" sx={{ justifySelf: { xs: "start", md: "end" } }}>
                          <IconButton
                            size="small"
                            aria-label="Cancel extraction"
                            onClick={() => setStopRequest(req)}
                          >
                            <CloseIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>}
            </Paper>

            {/* ── Import History ───────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader
                title="Import History"
                expanded={sectionsOpen.archive}
                onToggle={() => toggleSection("archive")}
                backgroundColor="#F4F6FB"
                textColor={colors.bodyText}
                chevronColor={colors.bodyText}
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
