import { useEffect, useRef, useState } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import { Box, Button, Grid, styled, Stack, TextField, Typography } from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import { DocumentStatus } from "@/models/Document";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { useUpdateDocument } from "@/hooks/api/useDocuments";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useNavigate } from "@tanstack/react-router";
import { DocumentTypes } from "@/utils/enums"
import { ConditionModal } from "./CreateConditionModal";
import LoadingButton from "../Shared/Buttons/LoadingButton";
import ConditionFilters from "@/components/Filters/ConditionFilters";
import { useConditionFilters } from "@/components/Filters/conditionFilterStore";
import { CONDITION_STATUS, ConditionStatus } from "@/models/Condition";

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
  documentTypeId: number;
  onDocumentLabelChange: (newLabel: string) => void;
};

export const Conditions = ({
  conditions,
  projectName,
  projectId,
  documentCategory,
  documentLabel,
  documentId,
  documentTypeId,
  onDocumentLabelChange
}: ConditionsParam) => {
  const navigate = useNavigate();
  const [hasAmendments, setHasAmendments] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noConditions, setNoConditions] = useState(conditions?.length === 0);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  
  const { filters } = useConditionFilters();

  const filteredConditions = conditions?.filter((condition) => {
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

    const matchesStatus = filters.status && filters.status.length > 0
      ? filters.status.includes(conditionStatus)
      : true;

    return matchesSearch && matchesSource && matchesAmendment && matchesStatus;
  });

  useEffect(() => {
    // Check if all conditions have status as true
    if (conditions && conditions.length > 0) {
      const allApproved = conditions.every((condition) => condition.is_approved === true);
      const conditionHasAmendments = conditions.some(condition => condition.amendment_names != null);
      setIsToggleEnabled(allApproved);
      setHasAmendments(conditionHasAmendments);

      const invalidConditions =
      conditions.length === 1 &&
      conditions.some(
        (condition) =>
          !condition.condition_name ||
          !condition.condition_number ||
          condition.is_approved === null
      );
      setNoConditions(invalidConditions);
    }
    setIsLoading(false);
  }, [conditions]);

  const handleOpenCreateNewCondition = async () => {
    setLoading(true);
    // Directly navigate to the 'Create Condition' page if the condition is not being added to an amendment.
    if (documentTypeId !== DocumentTypes.Amendment) {
      navigate({
        to: `/conditions/create/project/${projectId}/document/${documentId}`,
      });
    } else {
      setOpenModal(true);
    }
  };

  const handleCloseCreateNewCondition = () => {
    setOpenModal(false);
    setLoading(false);
  };

  const { mutateAsync: updateDocument } = useUpdateDocument(documentId);
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(documentLabel);
  useEffect(() => {
    setTempLabel(documentLabel || ""); 
  }, [documentLabel]);

  const handleEditClick = async () => {
    if (isEditing) {
      try {
        await updateDocument(tempLabel);
        onDocumentLabelChange(tempLabel);
        notify.success("Document label updated successfully");
      } catch (error) {
        notify.error("Failed to update document label");
      }
    }
    setIsEditing(!isEditing);
  };

  const documentLabelWidth = `${Math.max(200 + documentLabel.length * 6, 200)}px`;
  const textFieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Focus the TextField and set the cursor position to the end when it's rendered or when the documentLabel changes
    if (textFieldRef.current) {
      textFieldRef.current.focus();
      textFieldRef.current.setSelectionRange(documentLabel.length, documentLabel.length);
    }
  }, [documentLabel]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Grid container direction="column">
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
          <ConditionFilters conditions={conditions}/>
          <Box
            sx={{
              borderRadius: "3px",
              border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Grid container direction="row" p={1} px={2.5}>
              <Grid item xs={6}>
                <Typography
                  component="span"
                  fontWeight="normal"
                  fontSize="16px"
                  sx={{ color: '#898785' }}
                >
                  {documentCategory}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: "flex", justifyContent: "flex-end" }}>
                <LoadingButton
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{
                    borderRadius: "4px",
                    paddingLeft: "2px"
                  }}
                  onClick={() => handleOpenCreateNewCondition()}
                  loading={loading}
                >
                  <AddIcon fontSize="small" /> Add Condition
                </LoadingButton>
              </Grid>
            </Grid>
            <Grid container direction="row" px={2} pb={3} wrap="wrap">
              <Grid
                item
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: 'center',
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                  borderRadius: "4px 0 0 4px",
                  borderRight: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                  height: "40px",
                  overflow: "hidden",
                }}
              >
                {isEditing ? (
                  <TextField 
                    variant="outlined" 
                    value={isEditing ? tempLabel : documentLabel}
                    onChange={(e) => setTempLabel(e.target.value)}
                    sx={{
                      width: documentLabelWidth,
                      marginTop: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "0px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: "0px",
                      },
                    }}
                    inputRef={textFieldRef}
                  />
                ) : (
                  <Typography
                    variant="h6"
                    sx={{
                      px: BCDesignTokens.layoutPaddingXsmall,
                      py: BCDesignTokens.layoutPaddingSmall,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                >
                  {documentLabel}
                </Typography>
                )}
              </Grid>
              <Grid
                item
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                  borderLeft: "none",
                  borderRadius: "0 4px 4px 0",
                  height: "40px",
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleEditClick}
                  sx={{
                    alignSelf: "stretch",
                    borderRadius: "0 4px 4px 0",
                    border: `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
                    backgroundColor: BCDesignTokens.surfaceColorBackgroundLightGray,
                    height: '100%',
                    padding: '2.25px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: "black",
                    '&:hover': {
                      backgroundColor: BCDesignTokens.surfaceColorBorderDefault,
                    },
                  }}
                >
                  <Typography component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {isEditing ?
                      <SaveAltIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" /> :
                      <EditIcon sx={{ color: "#255A90", mr: 0.5 }} fontSize="small" />
                    }
                    <Box component="span" sx={{ mr: 1, color: "#255A90", fontWeight: "bold" }}>
                      {isEditing ? "Save" : "Edit"}
                    </Box>
                  </Typography>
                </Button>
              </Grid>
              <Grid item sx={{ display: "flex"}} px={1}>
                {hasAmendments && (
                  <Box sx={{ display: "flex", justifyContent: 'center', alignItems: "center" }}>
                    <LayersOutlinedIcon fontSize="small" />
                  </Box>
                )}
              </Grid>
              <Grid item sx={{ display: "flex"}} px={1}>
                <Box sx={{ display: "flex", justifyContent: 'center', alignItems: "center" }}>
                  <DocumentStatusChip
                    status={noConditions? "nodata" : String(isToggleEnabled) as DocumentStatus}
                  />
                </Box>
              </Grid>
            </Grid>
            <Grid container direction="row" p={1} px={2} pb={3}>
              <ConditionTable
                conditions={filteredConditions || []}
                projectId={projectId}
                documentId={documentId}
                noConditions={noConditions}
                documentTypeId={documentTypeId}
                tableType={""}
              />
            </Grid>
          </Box>
      </ContentBox>
      <ConditionModal
        open={openModal}
        onClose={handleCloseCreateNewCondition}
        projectId={projectId}
        documentId={documentId}
      />
    </Grid>
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
