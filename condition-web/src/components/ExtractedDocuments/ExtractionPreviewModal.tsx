import React from "react";
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    IconButton, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Box 
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ExtractionRequest } from "@/hooks/api/useExtractionRequests";

interface ExtractionPreviewModalProps {
    open: boolean;
    onClose: () => void;
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
    isRejecting
}) => {
    if (!extractionRequest || !extractionRequest.extracted_data) return null;

    const conditions = extractionRequest.extracted_data?.conditions || [];

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ backgroundColor: "#F7F9FC", borderBottom: "1px solid #E0E0E0", pb: 2, pt: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" fontWeight="bold">Extracted Conditions Preview</Typography>
                        <Typography variant="body2" color="textSecondary" mt={0.5}>
                            {extractionRequest.document_label || `Project Schedule B: Table of Conditions`}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" disabled={isImporting || isRejecting}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3, pb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2} mt={1}>
                    {conditions.length} Conditions Extracted
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#F9F9F9" }}>
                                <TableCell sx={{ fontWeight: "bold", color: "#666" }}>Condition #</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "#666" }}>Condition Name</TableCell>
                                <TableCell sx={{ fontWeight: "bold", color: "#666" }}>Tags</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conditions.map((cond: any, index: number) => (
                                <TableRow key={index} hover>
                                    <TableCell sx={{ color: "#003366", fontWeight: "bold" }}>
                                        {cond.condition_number || index + 1}
                                    </TableCell>
                                    <TableCell>{cond.condition_name}</TableCell>
                                    <TableCell>{cond.topic_tags?.join(", ") || ""}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            <DialogActions sx={{ backgroundColor: "#F7F9FC", borderTop: "1px solid #E0E0E0", p: 2, gap: 1 }}>
                <Button 
                    variant="outlined" 
                    onClick={() => onReject(extractionRequest.id)}
                    disabled={isRejecting || isImporting}
                    sx={{ 
                        color: "#003366", 
                        borderColor: "#003366", 
                        textTransform: "none", 
                        px: 3, 
                        fontWeight: "bold",
                        "&:hover": { borderColor: "#003366", backgroundColor: "rgba(0, 51, 102, 0.04)" }
                    }}
                >
                    {isRejecting ? "Rejecting..." : "Reject Extraction"}
                </Button>
                <Button 
                    variant="contained" 
                    onClick={() => onImport(extractionRequest.id)}
                    disabled={isImporting || isRejecting}
                    sx={{ 
                        backgroundColor: "#003366", 
                        color: "white", 
                        textTransform: "none", 
                        px: 3, 
                        fontWeight: "bold",
                        "&:hover": { backgroundColor: "#002244" }
                    }}
                >
                    {isImporting ? "Importing..." : "Import Conditions"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
