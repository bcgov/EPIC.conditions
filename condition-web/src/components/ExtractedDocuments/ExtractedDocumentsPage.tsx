import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "@tanstack/react-router";
import { ExtractionPreviewModal } from "./ExtractionPreviewModal";
import { PageGrid } from "@/components/Shared/PageGrid";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
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
  sectionHeaderBg: "#FFF8E1",
  sectionHeaderText: "#333",
  sectionHeaderChevron: "#666",

  // Extraction complete – success
  successBorder: "#C8E6C9",
  successBg: "#F1F8E9",
  successText: "#2E7D32",

  // Extraction complete – failed
  errorBorder: "#FFCDD2",
  errorBg: "#FFEBEE",
  errorText: "#C62828",

  // Extraction in progress
  pendingBorder: "#E0E0E0",
  pendingBg: "#F8F9FA",
  progressTrack: "#E0E0E0",
  progressBar: "#2E7D32",

  // Archive
  archiveBg: "#F0F0F0",
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
}

/** Static header bar rendered at the top of each section panel. */
const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <Box
    sx={{
      backgroundColor: colors.sectionHeaderBg,
      px: 2,
      py: 1.5,
      borderBottom: `1px solid ${colors.divider}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Typography variant="subtitle2" fontWeight="bold" color={colors.sectionHeaderText}>
      {title}
    </Typography>
    <ExpandMoreIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
  </Box>
);

export default function ExtractedDocumentsPage() {
  const { replaceBreadcrumb } = useBreadCrumb();
  const navigate = useNavigate();
  const { data: requests, isLoading, error } = useGetExtractionRequests();
  const importMutation = useImportExtractionRequest();
  const rejectMutation = useRejectExtractionRequest();

  const [previewRequest, setPreviewRequest] = useState<ExtractionRequest | null>(null);

  useEffect(() => {
    replaceBreadcrumb("Extracted Documents", "Extracted Documents", "/extracted-documents", true);
  }, [replaceBreadcrumb]);

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
      onError: (err: any) =>
        notify.error(err?.response?.data?.message || "Failed to import conditions"),
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Extraction rejected and deleted successfully!");
        setPreviewRequest(null);
      },
      onError: (err: any) =>
        notify.error(err?.response?.data?.message || "Failed to reject extraction"),
    });
  };

  const completedRequests =
    requests?.filter((r) => r.status === "completed" || r.status === "failed") ?? [];
  const pendingRequests = requests?.filter((r) => r.status === "pending") ?? [];
  const archivedRequests =
    requests?.filter((r) => r.status === "imported" || r.status === "rejected") ?? [];

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

            {/* ── Extraction Complete ───────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Extraction Complete" />
              <Box p={2} display="flex" flexDirection="column" gap={2}>
                {completedRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                    No recent extractions completed.
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
                        }}
                      >
                        {/* Document label */}
                        <Box flex={1}>
                          <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText}>
                            {req.document_label || `Document ${req.document_id}`}
                          </Typography>
                          {isSuccess && (
                            <Typography variant="caption" color="textSecondary">
                              {conditionCount} condition{conditionCount !== 1 ? "s" : ""} extracted
                            </Typography>
                          )}
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
                              {isSuccess ? "Extraction Complete!" : "Extraction Failed"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
                              {isSuccess
                                ? `Successfully extracted ${conditionCount} condition${conditionCount !== 1 ? "s" : ""} from the document.`
                                : "Unable to extract conditions. The file may be corrupted, scanned as an image, or in an unsupported format."}
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
                                : navigate({ to: "/documents/extract" })
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
              </Box>
            </Paper>

            {/* ── Extraction In Progress ────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Extraction In Progress" />
              <Box p={2} display="flex" flexDirection="column" gap={2}>
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
                      }}
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color={colors.bodyText}>
                          {req.document_label || `Document ${req.document_id}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Processing…
                        </Typography>
                      </Box>
                      <Box flex={1} px={4}>
                        <LinearProgress
                          variant="indeterminate"
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.progressTrack,
                            "& .MuiLinearProgress-bar": { backgroundColor: colors.progressBar },
                          }}
                        />
                      </Box>
                      <Box flex={0.2} display="flex" justifyContent="flex-end">
                        <IconButton
                          size="small"
                          aria-label="Cancel extraction"
                          onClick={() => handleReject(req.id)}
                        >
                          <CloseIcon fontSize="small" sx={{ color: colors.sectionHeaderChevron }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            {/* ── Documents Archive ─────────────────────────────────── */}
            <Paper elevation={0} sx={{ border: `1px solid ${colors.divider}`, borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Documents Archive" />
              <Box>
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
                    Date
                  </Typography>
                </Box>
                <Box p={2} display="flex" flexDirection="column" gap={1}>
                  {archivedRequests.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>
                      No archived documents.
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
                            {req.document_label || `Document ${req.document_id}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {req.status === "imported" ? "Imported" : "Rejected"}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color={colors.archiveDateText}>
                          {new Date(req.created_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>
            </Paper>

          </Box>
        )}
      </Grid>
    </PageGrid>
  );
}
