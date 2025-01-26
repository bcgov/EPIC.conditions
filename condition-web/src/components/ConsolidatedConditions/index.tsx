import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, FormControlLabel, Grid, styled, Stack, Switch, Typography } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import { DocumentStatus } from "@/models/Document";
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

type ConditionsParam = {
  conditions?: ConditionModel[];
  projectName: string;
  projectId: string;
  documentCategory: string;
  documentCategoryId: string;
  consolidationLevel?: string;
};

export const ConsolidatedConditions = ({
  projectName,
  projectId,
  documentCategory,
  documentCategoryId,
  conditions,
  consolidationLevel
}: ConditionsParam) => {
  const navigate = useNavigate();
  const [noConditions, setNoConditions] = useState(conditions?.length === 0);
  const [allApproved, setAllApproved] = useState(false);
  const [hasAmendments, setHasAmendments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggled, setIsToggled] = useState(true);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsToggled(!checked);
    if (!checked) {
      navigate({
        to: `/documents/project/${projectId}/document-category/${documentCategoryId}`,
      });
    }
  };
  
  useEffect(() => {
    // Check if all conditions have status as true
    if (conditions && conditions.length > 0) {
      const checkIfAllApproved = conditions.every((condition) => condition.is_approved === true);
      const conditionHasAmendments = conditions.some(condition => condition.amendment_names != null);

      const invalidConditions =
      conditions.length === 1 &&
      conditions.some(
        (condition) =>
          !condition.condition_name ||
          !condition.condition_number ||
          condition.is_approved === null
      );
      setNoConditions(invalidConditions);
      setAllApproved(checkIfAllApproved);
      setHasAmendments(conditionHasAmendments);
    }
    setIsLoading(false);
  }, [conditions]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
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
                <Stack direction={"row"}>
                  <Box sx={{ display: "flex", alignItems: "left", ml: 2 }}>
                    {consolidationLevel == 'project' ? 'Consolidated Conditions' : documentCategory}
                    {hasAmendments && (
                      <Box sx={{ display: "flex", alignItems: "top", mr: 1, mt: 1 }}>
                      <LayersOutlinedIcon fontSize="small" sx={{ ml: 1 }} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "top", fontWeight: "normal" }}>
                    <DocumentStatusChip
                      status={noConditions? "nodata" : String(allApproved) as DocumentStatus}
                      />
                  </Box>
                </Stack>
              </Grid>
              {consolidationLevel != 'project' &&
              <Grid item xs={6} textAlign="right">
                <FormControlLabel
                  control={
                    <Switch
                      checked={isToggled}
                      onChange={handleToggle}
                    />
                  }
                  label="View Consolidated Conditions"
                  labelPlacement="end"
                />
              </Grid>}
            </Grid>
            <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
              <CardInnerBox
                  sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
              >
                  <ConditionTable
                    conditions={conditions || []}
                    projectId={projectId}
                    documentId={""}
                    noConditions={noConditions}
                    documentTypeId={0}
                  />
              </CardInnerBox>
            </Box>
          </Typography>
        </Box>
      </ContentBox>
    </Stack>
  );
};

export const ConsolidatedConditionsSkeleton = () => {
  return (
    <Stack spacing={2} direction={"column"} sx={{ width: '100%' }}>
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
      <ContentBoxSkeleton />
    </Stack>
  );
};
