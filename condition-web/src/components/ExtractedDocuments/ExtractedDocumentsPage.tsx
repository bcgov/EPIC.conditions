import React, { useEffect, useState } from "react";
import { Grid, Typography, Button, Paper, Box, CircularProgress, LinearProgress, IconButton } from "@mui/material";
import { PageGrid } from "@/components/Shared/PageGrid";
import { useBreadCrumb } from "@/components/Shared/layout/SideNav/breadCrumbStore";
import { useNavigate } from "@tanstack/react-router";
import { useGetExtractionRequests, useImportExtractionRequest, useRejectExtractionRequest, ExtractionRequest } from "@/hooks/api/useExtractionRequests";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { ExtractionPreviewModal } from "./ExtractionPreviewModal";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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

  if (error) {
    notify.error("Failed to load extraction requests");
  }

  const handleImport = (id: number) => {
    importMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Conditions imported successfully!");
        setPreviewRequest(null);
      },
      onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to import conditions")
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id, {
      onSuccess: () => {
        notify.success("Extraction rejected and deleted successfully!");
        setPreviewRequest(null);
      },
      onError: (err: any) => notify.error(err?.response?.data?.message || "Failed to reject request")
    });
  };

  const completedRequests = requests?.filter(req => req.status === 'completed' || req.status === 'failed') || [];
  const pendingRequests = requests?.filter(req => req.status === 'pending') || [];
  const archivedRequests = requests?.filter(req => req.status === 'imported' || req.status === 'rejected') || [];

  const SectionHeader = ({ title }: { title: string }) => (
    <Box 
      sx={{ 
        backgroundColor: "#FFF8E1", 
        px: 2, 
        py: 1.5, 
        borderBottom: "1px solid #E0E0E0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" color="#333">{title}</Typography>
      <ExpandMoreIcon fontSize="small" sx={{ color: "#666" }} />
    </Box>
  );

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

      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" color="#003366">Extracted Documents</Typography>
        <Button
          variant="contained"
          onClick={() => navigate({ to: "/documents/extract" })}
          sx={{ backgroundColor: "#003366", textTransform: "none", borderRadius: 2 }}
        >
          + Add/Extract Document
        </Button>
      </Grid>
      
      <Grid item xs={12}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={4}>
            
            {/* Extraction Complete Section */}
            <Paper elevation={0} sx={{ border: "1px solid #E0E0E0", borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Extraction Complete" />
              <Box p={2} display="flex" flexDirection="column" gap={2}>
                {completedRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>No recent extractions completed.</Typography>
                ) : completedRequests.map(req => {
                  const isSuccess = req.status === 'completed';
                  return (
                    <Box 
                      key={req.id} 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 1,
                        border: `1px solid ${isSuccess ? "#C8E6C9" : "#FFCDD2"}`,
                        backgroundColor: isSuccess ? "#F1F8E9" : "#FFEBEE"
                      }}
                    >
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color="#333">
                          {req.document_label || `Document ${req.document_id}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(req.extracted_data?.conditions?.length || 0) * 123.4} KB
                        </Typography>
                      </Box>
                      
                      <Box flex={1} display="flex" alignItems="center" gap={1}>
                        {isSuccess ? 
                          <CheckCircleOutlineIcon color="success" /> : 
                          <ErrorOutlineIcon color="error" />
                        }
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold" color={isSuccess ? "#2E7D32" : "#C62828"}>
                            {isSuccess ? "Extraction Complete!" : "Extraction Failed"}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
                            {isSuccess ? 
                              `Successfully extracted ${req.extracted_data?.conditions?.length || 0} conditions from the document.` : 
                              "Unable to extract conditions. The file may be corrupted, scanned as an image, or in an unsupported format."
                            }
                          </Typography>
                        </Box>
                      </Box>

                      <Box flex={0.5} display="flex" justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<ChevronRightIcon />}
                          onClick={() => isSuccess ? setPreviewRequest(req) : navigate({ to: "/documents/extract" })}
                          sx={{ 
                            textTransform: "none", 
                            backgroundColor: "white", 
                            color: "#333", 
                            borderColor: "#E0E0E0",
                            "&:hover": { backgroundColor: "#F5F5F5", borderColor: "#CCC" }
                          }}
                        >
                          {isSuccess ? "Preview & Import Conditions" : "Switch to Manual Entry"}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>

            {/* Extraction In Progress Section */}
            <Paper elevation={0} sx={{ border: "1px solid #E0E0E0", borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Extraction In Progress" />
              <Box p={2} display="flex" flexDirection="column" gap={2}>
                {pendingRequests.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>No extractions currently in progress.</Typography>
                ) : pendingRequests.map(req => (
                  <Box 
                    key={req.id} 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      p: 2,
                      borderRadius: 1,
                      border: "1px solid #E0E0E0",
                      backgroundColor: "#F8F9FA"
                    }}
                  >
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold" color="#333">
                        {req.document_label || `Document ${req.document_id}`}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">Processing...</Typography>
                    </Box>
                    <Box flex={1} px={4}>
                      <LinearProgress variant="indeterminate" sx={{ height: 8, borderRadius: 4, backgroundColor: "#E0E0E0", "& .MuiLinearProgress-bar": { backgroundColor: "#2E7D32" } }} />
                    </Box>
                    <Box flex={0.2} display="flex" justifyContent="flex-end">
                      <IconButton size="small" onClick={() => handleReject(req.id)}>
                        <CloseIcon fontSize="small" sx={{ color: "#999" }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Documents Archive Section */}
            <Paper elevation={0} sx={{ border: "1px solid #E0E0E0", borderRadius: 2, overflow: "hidden" }}>
              <SectionHeader title="Documents Archive" />
              <Box>
                <Box display="flex" justifyContent="space-between" px={4} py={1} borderBottom="1px solid #E0E0E0" backgroundColor="#FAFAFA">
                  <Typography variant="caption" color="textSecondary">Document Name</Typography>
                  <Typography variant="caption" color="textSecondary">Imported On</Typography>
                </Box>
                <Box p={2} display="flex" flexDirection="column" gap={1}>
                  {archivedRequests.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2 }}>No archived documents.</Typography>
                  ) : archivedRequests.map(req => (
                    <Box 
                      key={req.id} 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: "#F0F0F0",
                        border: "1px solid #E0E0E0"
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="#333">
                          {req.document_label || `Document ${req.document_id}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">Archived</Typography>
                      </Box>
                      <Typography variant="body2" color="#666">
                        {new Date(req.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>

          </Box>
        )}
      </Grid>
    </PageGrid>
  );
}
