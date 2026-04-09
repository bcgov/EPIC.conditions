import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ExtractionRequest } from "@/hooks/api/useExtractionRequests";

// ---------- Design tokens --------------------------------------------------
const colors = {
  primary: "#003366",
  primaryDark: "#002244",
  primary04: "rgba(0, 51, 102, 0.04)",
  headerBg: "#F7F9FC",
  divider: "#E0E0E0",
  tableHeaderText: "#666",
  conditionNumber: "#003366",
};
// ---------------------------------------------------------------------------

export interface ExtractionPreviewModalProps {
  open: boolean;
  onClose: () => void;
  /** The request to preview. When null the dialog is mounted but hidden. */
  extractionRequest: ExtractionRequest | null;
  onReject: (id: number) => void;
  onImport: (id: number) => void;
  isImporting: boolean;
  isRejecting: boolean;
}

export const ExtractionPreviewModal: React.FC<ExtractionPreviewModalProps> = ({
  open,
  onClose,
  extractionRequest,
  onReject,
  onImport,
  isImporting,
  isRejecting,
}) => {
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);

  useEffect(() => {
    setShowRejectConfirmation(false);
  }, [extractionRequest?.id, open]);

  // Keep the Dialog mounted so MUI can run open/close animations correctly.
  // We render empty content when there is no request to show.
  const conditions = extractionRequest?.extracted_data?.conditions ?? [];
  const isBusy = isImporting || isRejecting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      {extractionRequest && (
        <>
          <DialogTitle
            sx={{
              backgroundColor: colors.headerBg,
              borderBottom: `1px solid ${colors.divider}`,
              pb: 2,
              pt: 2.5,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Extracted Conditions Preview
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={0.5}>
                  {extractionRequest.document_label ?? "Project Schedule B: Table of Conditions"}
                </Typography>
              </Box>
              <IconButton onClick={onClose} size="small" disabled={isBusy} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 3, pb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2} mt={1}>
              {conditions.length} Condition{conditions.length !== 1 ? "s" : ""} Extracted
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {["Condition #", "Condition Name", "Tags"].map((header) => (
                      <TableCell
                        key={header}
                        sx={{ fontWeight: "bold", color: colors.tableHeaderText }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conditions.map((cond: any, index: number) => (
                    <TableRow key={cond.condition_number ?? index} hover>
                      <TableCell sx={{ color: colors.conditionNumber, fontWeight: "bold" }}>
                        {cond.condition_number ?? index + 1}
                      </TableCell>
                      <TableCell>{cond.condition_name}</TableCell>
                      <TableCell>{cond.topic_tags?.join(", ") ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions
            sx={{
              backgroundColor: showRejectConfirmation ? "#F8E1E4" : colors.headerBg,
              borderTop: `1px solid ${colors.divider}`,
              p: 2,
              gap: 1,
              justifyContent: showRejectConfirmation ? "space-between" : "flex-end",
            }}
          >
            {showRejectConfirmation ? (
              <>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Reject Confirmation
                  </Typography>
                  <Typography variant="body1">
                    Are you sure you want to reject this extraction?
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" onClick={() => setShowRejectConfirmation(false)} disabled={isBusy}>
                    No, Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => onReject(extractionRequest.id)}
                    disabled={isBusy}
                  >
                    {isRejecting ? "Rejecting…" : "Yes, Reject"}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setShowRejectConfirmation(true)}
                  disabled={isBusy}
                  sx={{
                    color: colors.primary,
                    borderColor: colors.primary,
                    textTransform: "none",
                    px: 3,
                    fontWeight: "bold",
                    "&:hover": { borderColor: colors.primary, backgroundColor: colors.primary04 },
                  }}
                >
                  Reject Extraction
                </Button>
                <Button
                  variant="contained"
                  onClick={() => onImport(extractionRequest.id)}
                  disabled={isBusy}
                  sx={{
                    backgroundColor: colors.primary,
                    color: "white",
                    textTransform: "none",
                    px: 3,
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: colors.primaryDark },
                  }}
                >
                  {isImporting ? "Importing…" : "Import Conditions"}
                </Button>
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};
