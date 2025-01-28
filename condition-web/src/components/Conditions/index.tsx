import { useState, useEffect } from "react";
import { BCDesignTokens } from "epic.theme";
import { ConditionModel } from "@/models/Condition";
import {
  Autocomplete, 
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Modal,
  Paper,
  styled,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { ContentBoxSkeleton } from "../Shared/ContentBox/ContentBoxSkeleton";
import { ContentBox } from "../Shared/ContentBox";
import ConditionTable from "../Conditions/ConditionsTable";
import { DocumentModel, DocumentStatus } from "@/models/Document";
import DocumentStatusChip from "../Projects/DocumentStatusChip";
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useCreateCondition } from "@/hooks/api/useConditions";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useNavigate } from "@tanstack/react-router";
import { useLoadDocumentsByProject } from "@/hooks/api/useDocuments";
import { useLoadConditions } from "@/hooks/api/useConditions";
import { DocumentTypes } from "@/utils/enums"

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
};

export const Conditions = ({
  projectName,
  projectId,
  documentCategory,
  documentLabel,
  documentId,
  documentTypeId,
  conditions
}: ConditionsParam) => {
  const navigate = useNavigate();
  const [hasAmendments, setHasAmendments] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noConditions, setNoConditions] = useState(conditions?.length === 0);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | "">("");
  const [loadCondition, setLoadCondition] = useState(false);
  const [selectedConditionId, setSelectedConditionId] = useState<number | null>(null);

  const onCreateFailure = () => {
    notify.error("Failed to create condition");
  };

  const onCreateSuccess = () => {
    notify.success("Condition created successfully");
  };

  const { mutateAsync: createCondition } = useCreateCondition(projectId, documentId, {
    onSuccess: onCreateSuccess,
    onError: onCreateFailure,
  });

  const {
    data: documentData,
    isPending: isDocumentsLoading
  } = useLoadDocumentsByProject(
    true, projectId
  );

  const {
    data: documentConditions,
    isPending: isConditionsLoading,
  } = useLoadConditions(loadCondition, true, projectId, selectedDocumentId);

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

  const handleOpenCreateNewCondition = async (conditionDetails?: ConditionModel) => {
    // Directly navigate to the 'Create Condition' page if the condition is not being added to an amendment.
    if (documentTypeId !== DocumentTypes.Amendment) {
      try {
        const response = await createCondition(conditionDetails);
        if (response) {
          navigate({
            to: `/conditions/create/${response.condition_id}`,
          });
        }
      } catch (error) {
        notify.error("Failed to create condition");
      }
    } else {
      setOpenModal(true);
    }
  };

  const handleCloseCreateNewCondition = () => {
    setOpenModal(false);
    setSelectedDocumentId("");
    setSelectedConditionId(null);
  };

  const handleCreateNewCondition = async (conditionDetails?: ConditionModel) => {
    try {
      const response = await createCondition(conditionDetails);
      if (response) {
        navigate({
          to: `/conditions/create/${response.condition_id}`,
        });
      }
    } catch (error) {
      notify.error("Failed to create condition");
    }
  }

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
                    <Box sx={{ display: "flex", alignItems: "left", mr: 1, gap: 1 }}>
                      {documentLabel}
                      {hasAmendments && (
                        <Box sx={{ display: "flex", alignItems: "top", mr: 1, mt: 1 }}>
                        <LayersOutlinedIcon fontSize="small" />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "top", fontWeight: "normal" }}>
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
                    onClick={() => handleOpenCreateNewCondition({})}
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
                      documentTypeId={documentTypeId}
                      tableType={""}
                    />
                </CardInnerBox>
            </Box>
          </Typography>
        </Box>
      </ContentBox>
      <Modal open={openModal} onClose={handleCloseCreateNewCondition}>
        <Paper
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "500px",
            borderRadius: "4px",
            outline: "none",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={"14px 5px 14px 14px"}
          >
            <Typography variant="h6">Manual Condition Entry</Typography>
            <IconButton onClick={handleCloseCreateNewCondition}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            padding={"14px"}
          >
            <Stack direction={"column"} sx={{ width: "100%" }}>
              <Typography variant="body1" marginBottom={"2px"}>
                Select from Existing Document
              </Typography>
              <Autocomplete
                id="condition-selector"
                options={(documentData || []) as DocumentModel[]}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label=" "
                        InputLabelProps={{
                            shrink: false,
                        }}
                        fullWidth
                    />
                )}
                getOptionLabel={(document: DocumentModel) => document.document_label}
                onChange={(_e: React.SyntheticEvent<Element, Event>, document: DocumentModel | null) => {
                  setSelectedDocumentId(document?.document_id || "");
                  setLoadCondition(true);
                }}
                disabled={isDocumentsLoading}
                size="small"
              />
              {selectedDocumentId && !isConditionsLoading && (
                <>
              <Typography variant="body1" marginBottom={"2px"}>
                Condition
              </Typography>
              <Autocomplete
                id="condition-selector"
                options={documentConditions?.conditions || []}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label=" "
                        InputLabelProps={{
                            shrink: false,
                        }}
                        fullWidth
                    />
                )}
                getOptionLabel={(condition: ConditionModel) => 
                  `${condition.condition_number || "No Number"} - ${condition.condition_name || "Unknown Condition"}`
                }
                onChange={(_e: React.SyntheticEvent<Element, Event>, condition: ConditionModel | null) => {
                  setSelectedConditionId(condition?.condition_id || null);
                }}
                disabled={isConditionsLoading}
                size="small"
              /></>)}
              {selectedConditionId 
              && documentConditions?.conditions?.find(condition => condition.condition_id === selectedConditionId) 
              && (
                <Box sx={{ marginTop: 0 }}>
                  <Typography variant="body1" marginBottom={"2px"}>
                    Condition Preview
                  </Typography>
                  <TextField
                    value={
                      documentConditions.conditions
                      .find(condition => condition.condition_id === selectedConditionId)
                      ?.subconditions
                      ?.map(subcondition => subcondition.subcondition_text)
                      .join(' ')
                      || ""
                    }
                    InputProps={{
                      readOnly: true,
                    }}
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                  />
                </Box>
              )}
              <Typography variant="h6" marginBottom={"15px"}>
                OR
              </Typography>
              <Button
                variant="contained"
                sx={{ maxWidth: "55%" }}
                onClick={() => handleCreateNewCondition({})}
              >
                Add New Manual Condition
              </Button>
            </Stack>
          </Box>
          <Divider />
          <Box sx={{ display: "flex", justifyContent: "right", padding: "14px" }}>
            <Button
              variant="outlined"
              sx={{ minWidth: "100px" }}
              onClick={handleCloseCreateNewCondition}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ marginLeft: "8px", minWidth: "100px" }}
              onClick={() =>
                handleCreateNewCondition(
                  documentConditions?.conditions?.find(
                    (condition) => condition.condition_id === selectedConditionId
                  )
                )
              }
            >
              Next
            </Button>
          </Box>
        </Paper>
      </Modal>
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
