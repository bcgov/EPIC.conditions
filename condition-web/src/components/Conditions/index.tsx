import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, Button, FormControlLabel, Grid, styled, Stack, Switch, Typography } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import { DocumentStatus } from "@/models/Document";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AddIcon from '@mui/icons-material/Add';

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
  const [hasAmendments, setHasAmendments] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  const [showAddConditionPage, setShowAddConditionPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if all conditions have status as true
    if (conditions && conditions.length > 0) {
      const allApproved = conditions.every((condition) => condition.is_approved === true);
      const conditionHasAmendments = conditions.some(condition => condition.amendment_names != null);
      setIsToggleEnabled(allApproved);
      setHasAmendments(conditionHasAmendments);

      const invalidConditions = conditions.some(
        (condition) =>
          !condition.condition_name ||
          !condition.condition_number ||
          !condition.condition_text ||
          condition.is_approved === null
      );
      setShowAddConditionPage(invalidConditions);
    }
    setIsLoading(false);
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (showAddConditionPage) {
    return (
      <Stack spacing={2} direction={"column"} sx={{ width: "100%" }}>
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
                    <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
                      {documentName}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                      <DocumentStatusChip status={"nodata" as DocumentStatus} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{
                      borderRadius: "4px",
                      paddingLeft: "2px"
                    }}
                  >
                    <AddIcon fontSize="small" /> Add Condition
                  </Button>
                </Grid>
              </Grid>
            </Typography>
          </Box>
        </ContentBox>
      </Stack>
    );
  }

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
                  <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}> {/* Add horizontal padding to the document name */}
                    {documentName}
                    {hasAmendments && (
                        <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1 }} />
                    )}
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
