import { useState } from "react";
import {
    Modal,
    Paper,
    Box,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { DocumentTypeModel } from "@/models/Document";
import { ProjectModel } from "@/models/Project";
import { DocumentEntryForm } from "@/components/Documents/DocumentEntryForm";

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
    const [formKey, setFormKey] = useState(0);

    const handleClose = () => {
        setFormKey((prev) => prev + 1);
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} onTransitionEnd={onTransitionEnd}>
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
                        onClick={handleClose}
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <DocumentEntryForm
                    key={formKey}
                    documentType={documentType}
                    projectArray={projectArray}
                />
            </Paper>
        </Modal>
    );
};
