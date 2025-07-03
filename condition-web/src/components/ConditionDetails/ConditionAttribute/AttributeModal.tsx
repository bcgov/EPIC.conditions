import React from "react";
import {
  Modal,
  Paper,
  Box,
  IconButton,
  Typography,
  Divider,
  Stack,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AttributeKeyModel } from "@/models/AttributeKey";
import { CONDITION_KEYS } from "./Constants";

interface AttributeModalProps {
  open: boolean;
  onClose: () => void;
  attributes: AttributeKeyModel[];
  selectedAttribute: string;
  onSelectAttribute: (val: string) => void;
  isLoading?: boolean;
  renderEditableField: () => React.ReactNode;
  confirmDisabled: boolean;
  onConfirm: () => void;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  open,
  onClose,
  attributes,
  selectedAttribute,
  onSelectAttribute,
  isLoading = false,
  renderEditableField,
  confirmDisabled,
  onConfirm,
}) => {
    return (
        <Modal open={open} onClose={onClose} aria-labelledby="modal-title" aria-describedby="modal-description">
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
            <Box display="flex" justifyContent="space-between" alignItems="center" padding={"14px 5px 14px 14px"}>
            <Typography variant="h6">Add Condition Attribute</Typography>
            <IconButton onClick={onClose}>
                <CloseIcon />
            </IconButton>
            </Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center" padding={"14px"}>
            <Stack direction={"column"} sx={{ width: "100%" }}>
                <Typography variant="body1" marginBottom={"2px"}>
                Select an Attribute
                </Typography>
                {isLoading ? (
                <CircularProgress size={24} sx={{ display: "block", margin: "16px auto" }} />
                ) : (
                <Select
                    value={selectedAttribute}
                    onChange={(e) => onSelectAttribute(e.target.value)}
                    fullWidth
                    displayEmpty
                    sx={{
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    width: "100%",
                    "& .MuiSelect-select": {
                        padding: "8px",
                    },
                    mb: 2,
                    }}
                >
                    {attributes.map((attribute: AttributeKeyModel) => (
                    <MenuItem key={attribute.id} value={attribute.key_name}>
                        {attribute.key_name}
                    </MenuItem>
                    ))}
                </Select>
                )}
                {selectedAttribute && (
                <>
                    <Typography variant="body1">
                    {selectedAttribute === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_SUBMISSION
                        ? 'Select Value(s)'
                        : selectedAttribute === CONDITION_KEYS.MILESTONES_RELATED_TO_PLAN_IMPLEMENTATION
                        ? 'Select Value(s)'
                        : selectedAttribute === CONDITION_KEYS.PARTIES_REQUIRED
                        ? 'Add Parties to the List'
                        : selectedAttribute === CONDITION_KEYS.MANAGEMENT_PLAN_ACRONYM
                        ? 'Enter Acronym'
                        : 'Select a Value'}
                    </Typography>
                    {renderEditableField()}
                </>
                )}
                <Box sx={{ display: "flex", justifyContent: "right", mt: 2 }}>
                <Button variant="outlined" sx={{ minWidth: "100px" }} onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    sx={{ marginLeft: "8px", minWidth: "100px" }}
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                >
                    Confirm
                </Button>
                </Box>
            </Stack>
            </Box>
      </Paper>
    </Modal>
  );
};

export default AttributeModal;
