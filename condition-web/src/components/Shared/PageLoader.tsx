import { CircularProgress } from "@mui/material";

export const PageLoader = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <CircularProgress />
    </div>
  );
};
