import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { AllDocumentModel, DocumentStatus } from "@/models/Document";
import { Box, styled, Stack, FormControlLabel, Typography, Switch, Grid } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import DocumentTable from "./DocumentTable";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';

export const CardInnerBox = styled(Box)({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
  padding: "0 12px",
});

type DocumentsParam = {
  documents?: AllDocumentModel[];
  projectName: string;
  projectId: string;
  categoryId: number;
  documentLabel: string;
};

export const Documents = ({ projectName, projectId, categoryId, documentLabel, documents }: DocumentsParam) => {
  const navigate = useNavigate();
  const [isToggled, setIsToggled] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState<boolean | null>(false);
  const [isAllApproved, setIsAllApproved] = useState<boolean | null>(false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsToggled(checked);
    if (checked) {
      navigate({
        to: `/projects/${projectId}/document-category/${categoryId}/consolidated-conditions`,
      });
    }
  };

  useEffect(() => {
    // Check if all amendments have status as true
    if (documents && documents.length > 0) {
      const hasNullStatus = documents.some((document) => document.status === null);
      if (hasNullStatus) {
        setIsAllApproved(null);
      } else {
        const allApproved = documents.every((document) => document.status === true);
        setIsAllApproved(allApproved);
      }

      // Check if any document has is_latest_amendment_added as true
      const hasLatestAmendment = documents.some(doc => doc.is_latest_amendment_added === true);
      const anyLatestAmendmentAdded = hasNullStatus ? false : hasLatestAmendment;

      setIsToggleEnabled(anyLatestAmendmentAdded);
    }
  }, [documents]);

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
                    {documentLabel}
                    <LayersOutlinedIcon fontSize="small" sx={{ ml: 1, mr: 1 }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                    <DocumentStatusChip status={isAllApproved === null ? "nodata" : String(isAllApproved) as DocumentStatus} />
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
                  label="View Consolidated Conditions"
                  labelPlacement="end"
                />
              </Grid>
            </Grid>
            <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
                <CardInnerBox
                    sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
                >
                    <DocumentTable
                      projectId={projectId}
                      documents={documents || []}
                    />
                </CardInnerBox>
            </Box>
          </Typography>
        </Box>
      </ContentBox>
    </Stack>
  );
};

export const DocumentsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
