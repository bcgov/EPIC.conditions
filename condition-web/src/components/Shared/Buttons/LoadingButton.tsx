import React from "react";
import { Button, CircularProgress, ButtonProps } from "@mui/material";

interface LoadingButtonProps extends ButtonProps {
    loading: boolean; // Control loading state
    children: React.ReactNode; // Button text or icon
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, children, ...props }) => {
    return (
        <Button {...props} disabled={loading || props.disabled}>
            {loading ? <CircularProgress size={24} color="inherit" /> : children}
        </Button>
    );
};

export default LoadingButton;
