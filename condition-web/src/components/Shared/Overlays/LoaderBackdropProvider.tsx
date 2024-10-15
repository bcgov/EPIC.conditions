import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import { useLoaderBackdrop } from "./loaderBackdropStore";

const LoaderBackdropProvider: React.FC = () => {
  const { isOpen } = useLoaderBackdrop();

  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      open={isOpen}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default LoaderBackdropProvider;
