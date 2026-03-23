import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BCDesignTokens } from "epic.theme";
import { CONDITION_STATUS, ConditionModel, ConditionStatus } from "@/models/Condition";
import { DocumentStatus } from "@/models/Document";
import { Box, Button, FormControlLabel, Grid, Stack, Switch, Typography, styled } from "@mui/material";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import ConsolidatedConditionFilters from "@/components/Filters/ConsolidatedConditionFilters";
import { useConditionFilters } from "@/components/Filters/conditionFilterStore";
import { useExportConsolidatedConditionsPDF } from "@/hooks/api/useConsolidatedConditions";

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
  const [isToggled, setIsToggled] = useState(true);

  const noConditions = useMemo(() => {
    if (!conditions || conditions.length === 0) return true;
    if (conditions.length === 1) {
      return conditions.some(
        (c) => !c.condition_name || !c.condition_number || c.is_approved === null
      );
    }
    return false;
  }, [conditions]);

  const allApproved = useMemo(
    () => conditions?.every((c) => c.is_approved === true) ?? false,
    [conditions]
  );

  const hasAmendments = useMemo(
    () => conditions?.some((c) => c.amendment_names != null) ?? false,
    [conditions]
  );

  const { filters } = useConditionFilters();
  const { mutate: exportPDF, isPending: isExporting } = useExportConsolidatedConditionsPDF(projectName);

  const handleExportPDF = () => exportPDF(projectId);

  const filteredConditions = useMemo(() =>
    conditions?.filter((condition) => {
      const matchesSearch = filters.search_text
        ? condition.condition_name?.toLowerCase().includes(filters.search_text.toLowerCase()) ?? false
        : true;

      const matchesSource = filters.source_document
        ? condition.source_document?.toLowerCase().includes(filters.source_document.toLowerCase()) ?? false
        : true;

      const matchesAmendment = filters.amendment_names
        ? condition.amendment_names?.toLowerCase().includes(filters.amendment_names.toLowerCase()) ?? false
        : true;

      const conditionStatus: ConditionStatus = condition.is_approved
        ? CONDITION_STATUS.true.value
        : CONDITION_STATUS.false.value;

      const matchesStatus = filters.status?.length > 0
        ? filters.status.includes(conditionStatus)
        : true;

      return matchesSearch && matchesSource && matchesAmendment && matchesStatus;
    }),
  [conditions, filters]);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsToggled(!checked);
    if (!checked) {
      navigate({
        to: `/documents/project/${projectId}/document-category/${documentCategoryId}`,
      });
    }
  };
  
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
        <ConsolidatedConditionFilters conditions={conditions}/>
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
              <Grid item xs>
                <Stack direction={"row"}>
                  <Box sx={{ display: "flex", alignItems: "left", ml: 2, mr: 1, gap: 1 }}>
                    {consolidationLevel == 'project' ? 'Consolidated Conditions' : documentCategory}
                    {hasAmendments && (
                      <Box sx={{ display: "flex", alignItems: "top", mr: 1, mt: 1 }}>
                        <LayersOutlinedIcon fontSize="small" />
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
              {consolidationLevel != 'project' && (
                <Grid item sx={{ display: "flex", alignItems: "center" }}>
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
                </Grid>
              )}
              <Grid item sx={{ pr: BCDesignTokens.layoutPaddingMedium, flex: { xs: "auto", sm: "0 0 15%" } }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleExportPDF}
                  disabled={isExporting || !filteredConditions?.length}
                  sx={{ borderRadius: "4px", whiteSpace: "nowrap", width: "100%" }}
                >
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
              </Grid>
            </Grid>
            <Box height={"100%"} px={BCDesignTokens.layoutPaddingXsmall}>
              <CardInnerBox
                  sx={{ height: "100%", py: BCDesignTokens.layoutPaddingSmall }}
              >
                  <ConditionTable
                    conditions={filteredConditions || []}
                    projectId={projectId}
                    documentId={""}
                    noConditions={noConditions}
                    documentTypeId={0}
                    tableType={"consolidated"}
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
