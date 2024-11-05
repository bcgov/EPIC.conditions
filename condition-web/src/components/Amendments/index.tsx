import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { AllDocumentModel, DocumentStatus } from "@/models/Document";
import { Box, styled, Stack, FormControlLabel, Typography, Switch, Grid } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import AmendmentTable from "../Amendments/AmendmentTable";
import DocumentStatusChip from "../Documents/DocumentStatusChip";
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type AmendmentsParam = {
  amendments?: AllDocumentModel[];
  projectName: string;
  projectId: string;
  documentName: string;
  documentId: string;
};

export const Amendments = ({ projectName, projectId, documentName, documentId, amendments }: AmendmentsParam) => {
  const navigate = useNavigate();
  const [isToggled, setIsToggled] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsToggled(checked);
    if (checked) {
      navigate({
        to: `/conditions/project/${projectId}/document/${documentId}`,
      });
    }
  };

  useEffect(() => {
    // Check if all amendments have status as true
    if (amendments && amendments.length > 0) {
      const allApproved = amendments.every((amendment) => amendment.status === true);
      setIsToggleEnabled(allApproved);
    }
  }, [amendments]);

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      {/* Showing results message */}
      <ContentBox
        mainLabel={
          <Box component="span">
            <Typography component="span" variant="h5" fontWeight="normal">
              {projectName}
            </Typography>
          </Box>
        }
        label={""}
      >
        <Box
          sx={{
            borderRadius: "3px",
            border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              px: BCDesignTokens.layoutPaddingXsmall,
              py: BCDesignTokens.layoutPaddingSmall,
              borderBottom: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
            }}
          >
            <Grid container direction="row" paddingBottom={3}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    px: 2.5,
                    display: "flex", // Align items in a row
                    alignItems: "center", // Vertically center the elements
                  }}
                >
                  {/* Document Name and Icon */}
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {documentName}
                    <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                    <DocumentStatusChip status={String(isToggleEnabled) as DocumentStatus} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <FormControlLabel
                  control={
                    <Switch
                      disabled={!isToggleEnabled} // Disable the switch based on the isToggleEnabled state
                      checked={isToggled}
                      onChange={handleToggle} // Add onChange handler to toggle and navigate
                    />
                  }
                  label="View Consolidated Certificate"
                  labelPlacement="end"
                />
              </Grid>
            </Grid>
            <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
                <CardInnerBox
                    sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
                >
                    <AmendmentTable amendments={amendments || []} />
                </CardInnerBox>
            </Box>
          </Typography>
        </Box>
      </ContentBox>
    </Stack>
  );
};

export const AmendmentsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
