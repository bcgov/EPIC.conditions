import { Box, Paper, PaperProps, Typography } from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import React from "react";

type ContentBoxProps = {
  mainLabel: React.ReactNode;
  label?: string;
  children: React.ReactNode;
} & PaperProps;
export const ContentBox = ({
  children,
  mainLabel = "",
  label = "",
  ...rest
}: ContentBoxProps) => {
  return (
    <Paper
      elevation={2}
      {...rest}
      sx={{ boxShadow: BCDesignTokens.surfaceShadowMedium, maxWidth: "1448px" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "auto",
          padding: "12px 24px",
          backgroundColor: BCDesignTokens.surfaceColorBackgroundLightBlue,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
          }}
        >
          {mainLabel || ""}
        </Typography>
        {label && (
          <Typography
            variant="h5"
            color={BCDesignTokens.themeGray70}
            sx={{
              mr: 2,
              fontWeight: 400,
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          padding: "24px 16px 16px 16px",
          alignSelf: "stretch",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};
