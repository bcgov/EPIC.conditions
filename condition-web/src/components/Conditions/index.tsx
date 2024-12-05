import { useState, useEffect } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, Button, Grid, styled, Stack, Typography } from "@mui/material";
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
  documentCategory: string;
  documentLabel: string;
  documentId: string;
};

export const Conditions = ({
  projectName,
  projectId,
  documentCategory,
  documentLabel,
  documentId,
  conditions
}: ConditionsParam) => {

  const [hasAmendments, setHasAmendments] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noConditions, setNoConditions] = useState(false);

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
      setNoConditions(invalidConditions);
    }
    setIsLoading(false);
  }, [conditions]);

  if (isLoading) {
    return <div>Loading...</div>;
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
                <Stack
                  direction={"column"}
                  sx={{
                    px: 2.5,
                    display: "flex", // Align items in a row
                    alignItems: "left", // Vertically center the elements
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "left", mr: 1 }}>
                    <Typography
                      component="span"
                      fontWeight="normal"
                      fontSize="16px"
                      sx={{ color: '#898785' }}
                    >
                      {documentCategory}
                    </Typography>
                  </Box>
                  <Stack direction={"row"}>
                    <Box sx={{ display: "flex", alignItems: "left", mr: 1 }}>
                      {documentLabel}
                      {hasAmendments && (
                        <ContentCopyOutlinedIcon fontSize="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", fontWeight: "normal" }}>
                      <DocumentStatusChip
                        status={noConditions? "nodata" : String(isToggleEnabled) as DocumentStatus}
                      />
                    </Box>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={6} textAlign="right">
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{
                      marginRight: 2,
                      borderRadius: "4px",
                      paddingLeft: "2px"
                    }}
                  >
                    <AddIcon fontSize="small" /> Add Condition
                  </Button>
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
                      noConditions={noConditions}
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
