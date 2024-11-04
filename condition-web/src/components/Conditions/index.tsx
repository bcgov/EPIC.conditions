import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, FormControlLabel, Grid, styled, Stack, Switch, Typography } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import { DocumentStatus } from "@/models/Document";
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

type ConditionsParam = {
  conditions?: ConditionModel[];
  projectName: string;
  projectId: string;
  documentName: string;
  documentId: string;
};

export const Conditions = ({ projectName, projectId, documentName, documentId, conditions }: ConditionsParam) => {

  const navigate = useNavigate();
  const [isToggled, setIsToggled] = useState(true);

  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  useEffect(() => {
    // Check if all conditions have status as true
    if (conditions && conditions.length > 0) {
      const allApproved = conditions.every((condition) => condition.is_approved === true);
      setIsToggleEnabled(allApproved);
    }
  }, [conditions]);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsToggled(checked);
    if (!checked) {
      navigate({
        to: `/amendments/project/${projectId}/document/${documentId}`,
      });
    }
  };

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      {/* Showing results message */}
      <ContentBox mainLabel={projectName} label={""}>
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
                  <Box sx={{ display: "flex", alignItems: "center" }}> {/* Add horizontal padding to the document name */}
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
                    <ConditionTable
                      conditions={conditions || []}
                      projectId={projectId}
                      documentId={documentId}
                    />
                </CardInnerBox>
            </Box>
          </Typography>
        </Box>
      </ContentBox>
    </Stack>
  );
};

export const ConditionsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
