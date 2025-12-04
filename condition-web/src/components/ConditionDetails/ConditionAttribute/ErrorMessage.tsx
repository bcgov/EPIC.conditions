import React from "react";
import { Box } from "@mui/material";

type ErrorMessageProps = {
    visible: boolean;
    message: string;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ visible, message }) => {
    if (!visible) return null;
    return (
      <Box sx={{ color: "#CE3E39", fontSize: "14px", marginTop: 1 }}>
        {message}
      </Box>
    );
};

export default ErrorMessage;
