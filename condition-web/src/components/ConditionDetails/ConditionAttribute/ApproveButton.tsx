import React from "react";
import { Box, Button } from "@mui/material";

interface ApproveButtonProps {
    isApproved: boolean;
    isAnyRowEditing: boolean;
    showEditingError: boolean;
    isEditingPlanName?: boolean;
    onApprove: (e: React.MouseEvent) => void;
    label?: string;
}

export const ApproveButton: React.FC<ApproveButtonProps> = ({
    isApproved,
    isAnyRowEditing,
    showEditingError,
    isEditingPlanName,
    onApprove,
    label
  }) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          sx={{
            padding: "4px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            textTransform: "none",
          }}
          onClick={onApprove}
        >
            {label
            ? label
            : isApproved
            ? "Un-approve Condition Attributes"
            : "Approve Condition Attributes"}
        </Button>
  
        {showEditingError && (isAnyRowEditing || isEditingPlanName) && (
          <Box
            sx={{
              color: "#CE3E39",
              fontSize: "14px",
              marginTop: 1,
              marginBottom: "15px",
              textAlign: "right",
            }}
          >
            Please save your changes before approving the Condition Attributes.
          </Box>
        )}
      </Box>
    );
};
